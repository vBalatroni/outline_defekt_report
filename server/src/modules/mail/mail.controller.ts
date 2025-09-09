import { Body, Controller, Get, HttpException, HttpStatus, Post, Query, Res, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { IsEmail, IsOptional, IsString } from 'class-validator';
import { MailService } from './mail.service';
import { Response } from 'express';

class SendMailDto {
  @IsString()
  supplierHtml!: string;

  @IsString()
  customerHtml!: string;

  @IsOptional()
  @IsEmail()
  supplierRecipient?: string;

  @IsOptional()
  @IsEmail()
  customerRecipient?: string;

  @IsOptional()
  @IsEmail()
  testRecipient?: string;

  @IsOptional()
  @IsString()
  submissionId?: string;

  @IsOptional()
  @IsEmail()
  ownerEmail?: string;

  @IsOptional()
  attachments?: { filename: string; content: string; contentType?: string }[];
}

@Controller('mail')
export class MailController {
  constructor(private readonly mail: MailService) {}

  @Post('send')
  async send(@Body() body: SendMailDto) {
    const defaults = this.mail.getDefaultRecipients();
    const supplierTo = body.testRecipient || body.supplierRecipient || defaults.supplier;
    const customerTo = body.testRecipient || body.customerRecipient || defaults.testing;

    if (!supplierTo || !customerTo) {
      throw new HttpException('Missing recipients', HttpStatus.BAD_REQUEST);
    }

    try {
      // Build a descriptive folder name: <email>-<YYYY-MM-DD_HH-mm>-<submissionId>
      const senderEmail = body.customerRecipient || body.testRecipient || body.supplierRecipient || '';
      const now = new Date();
      const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
      const ts = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}`;
      const safeEmail = String(senderEmail || 'unknown').replace(/[^a-zA-Z0-9_.@+-]/g, '_');
      const idPart = body.submissionId || `${Date.now()}`;
      const folderName = `${safeEmail}-${ts}-${idPart}`;
      const folder = await this.mail.saveReportsToDrive(body.supplierHtml, body.customerHtml, folderName);
      if (Array.isArray(body.attachments) && body.attachments.length > 0) {
        await this.mail.saveAttachmentsToDrive(folder.id!, body.attachments);
      }

      await this.mail.send(supplierTo, 'New Defekt Report - Supplier Details', body.supplierHtml);
      await this.mail.send(customerTo, 'Your Defekt Report Summary', body.customerHtml);

      const owner = body.ownerEmail || process.env.OWNER_EMAIL || process.env.FROM_EMAIL || process.env.SMTP_USERNAME || '';
      if (owner) {
        const link = folder.webViewLink || '';
        const recapHtml = `<!DOCTYPE html><html><body>
          <p>New Defekt Report submission.</p>
          <p>Folder: <a href="${link}" target="_blank" rel="noreferrer">${link}</a></p>
          <p>Supplier: ${supplierTo}<br/>Customer: ${customerTo}</p>
          <p>ID: ${body.submissionId || '-'}</p>
        </body></html>`;
        await this.mail.send(owner, 'Defekt Report - Submission Recap', recapHtml);
      }
      return { success: true, driveFolder: { id: folder.id, webViewLink: folder.webViewLink } };
    } catch (e: any) {
      throw new HttpException(e?.message || 'Send failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Multipart endpoint: invia supplierHtml, customerHtml, submissionId e files[] come FormData
  @Post('send-multipart')
  @UseInterceptors(FilesInterceptor('files', 30, { storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } }))
  async sendMultipart(
    @UploadedFiles() files: any[],
    @Body() body: any,
  ) {
    const supplierHtml = body.supplierHtml || '';
    const customerHtml = body.customerHtml || '';
    const submissionId = body.submissionId || `${Date.now()}`;
    const owner = body.ownerEmail || process.env.OWNER_EMAIL || process.env.FROM_EMAIL || process.env.SMTP_USERNAME || '';
    const supplierTo = body.supplierRecipient || owner;
    const customerTo = body.customerRecipient || owner;

    if (!supplierTo || !customerTo) {
      throw new HttpException('Missing recipients', HttpStatus.BAD_REQUEST);
    }

    try {
      const senderEmail = customerTo || supplierTo || '';
      const now = new Date();
      const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
      const ts = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}`;
      const safeEmail = String(senderEmail || 'unknown').replace(/[^a-zA-Z0-9_.@+-]/g, '_');
      const folderName = `${safeEmail}-${ts}-${submissionId}`;
      const folder = await this.mail.saveReportsToDrive(supplierHtml, customerHtml, folderName);
      if (Array.isArray(files) && files.length > 0) {
        console.log('[send-multipart] received files:', files.map(f => ({ name: f.originalname, size: f.size, mimetype: f.mimetype })));
        await this.mail.saveUploadedFilesToDrive(folder.id!, files);
      } else {
        console.log('[send-multipart] no files received');
      }

      await this.mail.send(supplierTo, 'New Defekt Report - Supplier Details', supplierHtml);
      await this.mail.send(customerTo, 'Your Defekt Report Summary', customerHtml);

      if (owner) {
        const link = folder.webViewLink || '';
        const recapHtml = `<!DOCTYPE html><html><body>
          <p>New Defekt Report submission.</p>
          <p>Folder: <a href="${link}" target="_blank" rel="noreferrer">${link}</a></p>
          <p>Supplier: ${supplierTo}<br/>Customer: ${customerTo}</p>
          <p>ID: ${submissionId}</p>
        </body></html>`;
        await this.mail.send(owner, 'Defekt Report - Submission Recap', recapHtml);
      }
      return { success: true, driveFolder: { id: folder.id, webViewLink: folder.webViewLink } };
    } catch (e: any) {
      throw new HttpException(e?.message || 'Send failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // OAuth2: redirect to Google consent screen
  @Get('auth')
  async auth(@Res() res: Response) {
    const url = this.mail.generateGoogleAuthUrl();
    return res.redirect(url);
  }

  // OAuth2 callback: exchange code for tokens
  @Get('oauth2callback')
  async oauthCallback(@Query('code') code: string) {
    if (!code) {
      throw new HttpException('Missing code', HttpStatus.BAD_REQUEST);
    }
    const tokens = await this.mail.exchangeCodeForTokens(code);
    return { success: true, tokens };
  }

  // Diagnostics: verify transport
  @Get('verify')
  async verify() {
    return this.mail.verifyTransport();
  }

  // Diagnostics: test send
  @Post('test')
  async test(@Body('to') to: string) {
    if (!to) {
      throw new HttpException('Missing "to"', HttpStatus.BAD_REQUEST);
    }
    await this.mail.testSend(to);
    return { ok: true };
  }
}


