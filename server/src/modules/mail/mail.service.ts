import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { Readable } from 'stream';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MailService {
  constructor(private readonly prisma: PrismaService) {}

  private get oauth2Client() {
    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4000/mail/oauth2callback',
    );
    if (process.env.GOOGLE_REFRESH_TOKEN) {
      client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
    }
    return client;
  }

  private async getTransporter() {
    // Prefer OAuth2 if configured, fallback to SMTP user/pass
    if (
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      (process.env.GOOGLE_REFRESH_TOKEN || process.env.GOOGLE_ACCESS_TOKEN)
    ) {
      const oauth2Client = this.oauth2Client;
      // Always try to refresh if refresh token is available (ensures fresh access token)
      if (process.env.GOOGLE_REFRESH_TOKEN) {
        const { token } = await oauth2Client.getAccessToken();
        if (token) process.env.GOOGLE_ACCESS_TOKEN = token as string;
      }
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: process.env.SMTP_USERNAME,
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
          accessToken: process.env.GOOGLE_ACCESS_TOKEN,
        },
        logger: true,
        debug: true,
      } as any);
    }

    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'ssl',
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
      },
      logger: true,
      debug: true,
    });
  }

  getDefaultRecipients() {
    return {
      supplier: process.env.SUPPLIER_TO || '',
      testing: process.env.TESTING_TO || '',
    };
  }

  async send(to: string, subject: string, html: string) {
    const toPlainText = (h: string) => {
      try {
        return (h || '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      } catch {
        return '';
      }
    };
    const text = toPlainText(html);
    try {
      // Debug log
      const htmlLen = typeof html === 'string' ? html.length : 0;
      const textLen = typeof text === 'string' ? text.length : 0;
      console.log(`[MailService] Sending mail to=${to} subject="${subject}" htmlLen=${htmlLen} textLen=${textLen}`);
      const transporter = await this.getTransporter();
      const result = await transporter.sendMail({
        from: {
          name: process.env.FROM_NAME || 'Defekt Report System',
          address: process.env.FROM_EMAIL || process.env.SMTP_USERNAME || '',
        },
        to,
        subject,
        html,
        text,
        headers: { 'X-Mailer': 'Defekt-Report' },
        textEncoding: 'quoted-printable',
      });
      // Log su DB non bloccante (ignora errori se tabelle mancanti)
      try {
        await this.prisma.emailLog.create({
          data: { to, subject, status: 'SENT' },
        });
      } catch (logErr: any) {
        console.warn('[MailService] emailLog create failed (non-blocking):', String(logErr?.message || logErr));
      }
      return result;
    } catch (err: any) {
      // Tenta log errore ma non bloccare se mancano le tabelle
      try {
        await this.prisma.emailLog.create({
          data: { to, subject, status: 'ERROR', error: String(err?.message || err) },
        });
      } catch (logErr: any) {
        console.warn('[MailService] emailLog create (error) failed (non-blocking):', String(logErr?.message || logErr));
      }
      throw err;
    }
  }

  // OAuth2 helpers
  generateGoogleAuthUrl() {
    const oauth2Client = this.oauth2Client;
    const scopes = [
      // Per SMTP XOAUTH2
      'https://mail.google.com/',
      // Per salvataggio file su Drive (solo file creati dall'app)
      'https://www.googleapis.com/auth/drive.file',
      // Per leggere metadati di cartelle esistenti (risolve nomi/percorsi)
      'https://www.googleapis.com/auth/drive.metadata.readonly',
    ];
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes,
    });
  }

  async exchangeCodeForTokens(code: string) {
    const oauth2Client = this.oauth2Client;
    const { tokens } = await oauth2Client.getToken(code);
    return tokens; // contains access_token and refresh_token (on first consent)
  }

  // Diagnostics
  async verifyTransport() {
    try {
      const usingOauth2 = Boolean(
        process.env.GOOGLE_CLIENT_ID &&
          process.env.GOOGLE_CLIENT_SECRET &&
          (process.env.GOOGLE_REFRESH_TOKEN || process.env.GOOGLE_ACCESS_TOKEN),
      );
      const transporter = await this.getTransporter();
      await transporter.verify();
      return {
        ok: true,
        message: 'Transport verified',
        method: usingOauth2 ? 'oauth2' : 'smtp',
        user: process.env.SMTP_USERNAME || '',
        details: {
          hasClientId: Boolean(process.env.GOOGLE_CLIENT_ID),
          hasClientSecret: Boolean(process.env.GOOGLE_CLIENT_SECRET),
          hasRefreshToken: Boolean(process.env.GOOGLE_REFRESH_TOKEN),
          hasAccessToken: Boolean(process.env.GOOGLE_ACCESS_TOKEN),
        },
      };
    } catch (e: any) {
      const usingOauth2 = Boolean(
        process.env.GOOGLE_CLIENT_ID &&
          process.env.GOOGLE_CLIENT_SECRET &&
          (process.env.GOOGLE_REFRESH_TOKEN || process.env.GOOGLE_ACCESS_TOKEN),
      );
      return {
        ok: false,
        method: usingOauth2 ? 'oauth2' : 'smtp',
        user: process.env.SMTP_USERNAME || '',
        details: {
          hasClientId: Boolean(process.env.GOOGLE_CLIENT_ID),
          hasClientSecret: Boolean(process.env.GOOGLE_CLIENT_SECRET),
          hasRefreshToken: Boolean(process.env.GOOGLE_REFRESH_TOKEN),
          hasAccessToken: Boolean(process.env.GOOGLE_ACCESS_TOKEN),
        },
        error: String(e?.message || e),
      };
    }
  }

  // ===============
  // Google Drive I/O
  // ===============
  private getDriveClient() {
    const oauth2Client = this.oauth2Client;
    return google.drive({ version: 'v3', auth: oauth2Client });
  }

  // ---- Drive helpers (folder resolution by ID, name or path) ----
  private async findFolderIdByName(name: string, parentId?: string) {
    const drive = this.getDriveClient();
    const qParts = [
      `name = '${name.replace(/'/g, "\\'")}'`,
      `mimeType = 'application/vnd.google-apps.folder'`,
      'trashed = false',
    ];
    if (parentId) qParts.push(`'${parentId}' in parents`);
    const res = await drive.files.list({
      q: qParts.join(' and '),
      fields: 'files(id, name)',
      pageSize: 1,
      spaces: 'drive',
    });
    const files = res.data.files || [];
    return files.length ? files[0].id! : null;
  }

  private async ensureFolder(name: string, parentId?: string) {
    const existingId = await this.findFolderIdByName(name, parentId);
    if (existingId) return existingId;
    const created = await this.createDriveFolder(name, parentId);
    return created.id!;
  }

  private async resolveFolderSpecToId(folderSpec: string) {
    // Se esplicitamente indicato che è un ID, usalo senza leggere metadati
    const forceId = String(process.env.DRIVE_PARENT_IS_ID || '').toLowerCase() === 'true';
    const looksLikeId = /^[A-Za-z0-9_-]{10,}$/.test(folderSpec) && !folderSpec.includes('/');
    if (forceId || looksLikeId) {
      return folderSpec; // usa direttamente come parentId
    }

    // Prova a risolvere via API (richiede scope metadata.readonly)
    const drive = this.getDriveClient();
    try {
      const file = await drive.files.get({ fileId: folderSpec, fields: 'id' });
      if (file?.data?.id) return file.data.id;
    } catch (_) {
      // Non è un ID accessibile; trattalo come nome o percorso
    }

    // Se percorso tipo a/b/c, risolvi (crea se mancante)
    const segments = folderSpec.split('/').filter(Boolean);
    let currentParent: string | undefined = undefined;
    for (const seg of segments) {
      try {
        currentParent = await this.ensureFolder(seg, currentParent);
      } catch (e) {
        // In caso di permessi insufficienti per list/create, rilancia con messaggio chiaro
        throw new Error('Insufficient Drive permissions to resolve folder path. Use DRIVE_PARENT_IS_ID=true con un ID cartella oppure rinnova il consenso con lo scope drive.metadata.readonly.');
      }
    }
    return currentParent;
  }

  private async createDriveFolder(name: string, parentId?: string) {
    const drive = this.getDriveClient();
    const fileMetadata: any = {
      name,
      mimeType: 'application/vnd.google-apps.folder',
    };
    if (parentId) {
      // Verifica che la cartella parent esista e sia accessibile
      try {
        await drive.files.get({ fileId: parentId, fields: 'id, name' });
      } catch (e: any) {
        console.error('[Drive] Errore accesso cartella parent:', parentId, e.message);
        throw new Error(`Cartella Google Drive non trovata o non accessibile (ID: ${parentId}). Verifica che: 1) L'ID sia corretto, 2) La cartella sia condivisa con l'account OAuth2, 3) DRIVE_PARENT_IS_ID=true se usi un ID.`);
      }
      fileMetadata.parents = [parentId];
    }
    const res = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id, webViewLink',
    });
    return res.data;
  }

  private async uploadHtmlToFolder(folderId: string, filename: string, html: string) {
    const drive = this.getDriveClient();
    const media = {
      mimeType: 'text/html',
      body: Readable.from(Buffer.from(html || '', 'utf8')),
    } as any;
    const requestBody: any = {
      name: filename,
      parents: [folderId],
    };
    const res = await drive.files.create({
      requestBody,
      media,
      fields: 'id, webViewLink',
    });
    return res.data;
  }

  async saveReportsToDrive(supplierHtml: string, customerHtml: string, folderName: string) {
    const parentSpec = process.env.DRIVE_PARENT_FOLDER_ID || '';
    const parentId = parentSpec ? await this.resolveFolderSpecToId(parentSpec) : undefined;
    const folder = await this.createDriveFolder(folderName, parentId);
    await this.uploadHtmlToFolder(folder.id!, 'defekt_report_supplier.html', supplierHtml || '');
    await this.uploadHtmlToFolder(folder.id!, 'defekt_report_customer.html', customerHtml || '');
    return folder;
  }

  async saveAttachmentsToDrive(folderId: string, attachments: { filename: string; content: string; contentType?: string }[]) {
    const drive = this.getDriveClient();
    for (const att of attachments || []) {
      const media = {
        mimeType: att.contentType || 'application/octet-stream',
        body: Readable.from(Buffer.from(att.content, 'base64')),
      } as any;
      const requestBody: any = {
        name: att.filename || `file-${Date.now()}`,
        parents: [folderId],
      };
      await drive.files.create({ requestBody, media, fields: 'id' });
    }
  }

  async saveUploadedFilesToDrive(folderId: string, files: any[]) {
    const drive = this.getDriveClient();
    for (const file of files || []) {
      const media = {
        mimeType: file.mimetype || 'application/octet-stream',
        body: Readable.from(file.buffer),
      } as any;
      const requestBody: any = {
        name: file.originalname || `file-${Date.now()}`,
        parents: [folderId],
      };
      await drive.files.create({ requestBody, media, fields: 'id' });
    }
  }

  async testSend(to: string) {
    const html = '<b>Test email from Defekt Report</b>';
    return this.send(to, 'SMTP/OAuth2 Test', html);
  }
}


