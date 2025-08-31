import { Body, Controller, HttpException, HttpStatus, Post } from '@nestjs/common';
import { IsEmail, IsOptional, IsString } from 'class-validator';
import { MailService } from './mail.service';

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
}


