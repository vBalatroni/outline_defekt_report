import { Body, Controller, Get, HttpException, HttpStatus, Post, Query, Res } from '@nestjs/common';
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
      await this.mail.send(supplierTo, 'New Defekt Report - Supplier Details', body.supplierHtml);
      await this.mail.send(customerTo, 'Your Defekt Report Summary', body.customerHtml);
      return { success: true };
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


