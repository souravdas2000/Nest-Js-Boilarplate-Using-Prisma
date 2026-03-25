import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendEmail(data: { to: string; subject: string; html?: string }) {
    return await this.mailerService.sendMail({
      to: data.to,
      from: {
        address: this.configService.get('FROM'),
        name: 'Nest Template',
      },
      subject: data.subject,
    });
  }

  /**
   * Helper method to send the email
   * @param data
   */
  async sendMail(data: {
    to: string;
    subject: string;
    template: string;
    contextData: any;
  }) {
    await this.mailerService.sendMail({
      to: data.to,
      from: {
        address: this.configService.get('FROM'),
        name: 'Nest Template',
      },
      subject: data.subject,
      template: data.template,
      context: data.contextData,
    });
  }
}
