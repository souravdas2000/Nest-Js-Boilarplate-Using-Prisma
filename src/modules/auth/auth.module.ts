import { Module } from '@nestjs/common';
import { JwtTokenService } from './services/jwt-token.service';
import { JwtService } from '@nestjs/jwt';
import { OtpService, SocialAuthVerifyService } from './services';
import { AuthGuard } from './guards';

@Module({
  providers: [
    JwtTokenService,
    SocialAuthVerifyService,
    JwtService,
    AuthGuard,
    OtpService,
  ],
  exports: [JwtTokenService, SocialAuthVerifyService, JwtService, OtpService],
})
export class AuthModule {}
