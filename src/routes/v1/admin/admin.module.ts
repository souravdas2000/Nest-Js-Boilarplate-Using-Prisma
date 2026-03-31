import { Module } from '@nestjs/common';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { AuthModule } from '@modules/auth/auth.module';
import { EmailModule } from '@modules/email/email.module';

@Module({
  imports: [AuthModule, EmailModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AdminModule {}
