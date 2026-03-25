import { MailerOptions, MailerOptionsFactory } from '@nestjs-modules/mailer';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';

@Injectable()
export class EmailConfigService implements MailerOptionsFactory {
  constructor(private configService: ConfigService) {}

  createMailerOptions(): MailerOptions | Promise<MailerOptions> {
    return {
      transport: {
        host: this.configService.get('SES_HOST'),
        port: this.configService.get('SES_PORT'),
        auth: {
          user: this.configService.get('SMTP_USERNAME'),
          pass: this.configService.get('SMTP_PASSWORD'),
        },
      },
      template: {
        dir: join(__dirname, '../../../mail/templates'),
        adapter: new EjsAdapter(),
        options: {
          strict: false,
        },
      },
    };
  }
}
