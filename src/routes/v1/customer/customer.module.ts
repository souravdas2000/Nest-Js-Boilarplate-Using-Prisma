import { Module } from '@nestjs/common';
import { UserModule } from '@modules/user/user.module';
import { AuthModule } from '@modules/auth/auth.module';
import { EmailModule } from '@modules/email/email.module';
import { AuthController } from './auth/auth.controller';

import { AuthService } from './auth/auth.service';

@Module({
  imports: [UserModule, AuthModule, EmailModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class CustomerModule {}
