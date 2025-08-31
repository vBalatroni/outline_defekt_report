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
  });

  async send(to: string, subject: string, html: string) {
    try {
      const result = await this.transporter.sendMail({
        from: {
          name: process.env.FROM_NAME || 'Defekt Report System',
          address: process.env.FROM_EMAIL || process.env.SMTP_USERNAME || '',
        },
        to,
        subject,
        html,
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


