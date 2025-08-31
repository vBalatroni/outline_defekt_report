import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
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
    return this.transporter.sendMail({
      from: {
        name: process.env.FROM_NAME || 'Defekt Report System',
        address: process.env.FROM_EMAIL || process.env.SMTP_USERNAME || '',
      },
      to,
      subject,
      html,
    });
  }
}


