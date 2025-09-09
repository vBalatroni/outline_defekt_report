import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { google } from 'googleapis';
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
      await this.prisma.emailLog.create({
        data: { to, subject, status: 'SENT' },
      });
      return result;
    } catch (err: any) {
      await this.prisma.emailLog.create({
        data: { to, subject, status: 'ERROR', error: String(err?.message || err) },
      });
      throw err;
    }
  }

  // OAuth2 helpers
  generateGoogleAuthUrl() {
    const oauth2Client = this.oauth2Client;
    const scopes = [
      // Per SMTP XOAUTH2 usare lo scope completo
      'https://mail.google.com/',
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

  async testSend(to: string) {
    const html = '<b>Test email from Defekt Report</b>';
    return this.send(to, 'SMTP/OAuth2 Test', html);
  }
}


