import { Module } from '@nestjs/common';
import { EmailService } from './services/email.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailConfigService } from './services';

@Module({
  imports: [
    MailerModule.forRootAsync({
      useClass: EmailConfigService,
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
