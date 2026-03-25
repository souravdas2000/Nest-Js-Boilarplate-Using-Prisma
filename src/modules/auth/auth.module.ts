import { Module } from '@nestjs/common';
import { JwtTokenService } from './services/jwt-token.service';
import { JwtService } from '@nestjs/jwt';
import { OtpService, SocialAuthVerifyService } from './services';
import { AuthGuard } from './guards';
import { MongooseModule } from '@nestjs/mongoose';
import { EDbModelName } from '@modules/database/constants';
import { UserSchema } from '@modules/user/schemas/user.schema';
import { TokenSchema } from './schemas/token.schema';
import { OtpSchema } from './schemas/otp.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EDbModelName.User, schema: UserSchema },
      { name: EDbModelName.Token, schema: TokenSchema },
      { name: EDbModelName.Otp, schema: OtpSchema },
    ]),
  ],
  providers: [
    JwtTokenService,
    SocialAuthVerifyService,
    JwtService,
    AuthGuard,
    OtpService,
  ],
  exports: [
    JwtTokenService,
    SocialAuthVerifyService,
    JwtService,
    OtpService,
    MongooseModule,
  ],
})
export class AuthModule {}
