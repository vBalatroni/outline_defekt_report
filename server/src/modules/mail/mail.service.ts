import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MailService {
  constructor(private readonly prisma: PrismaService) {}

  private transporter = nodemailer.createTransport({
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
      const result = await this.transporter.sendMail({
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
}


