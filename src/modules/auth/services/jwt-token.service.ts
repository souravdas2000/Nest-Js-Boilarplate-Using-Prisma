import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import dayjs from 'dayjs';
import { ETokenType } from '../constants';
import { InjectModel } from '@nestjs/mongoose';
import { EDbModelName } from '@modules/database/constants';
import { Model } from 'mongoose';
import { TokenDocument } from '../schemas/token.schema';
import { I18nService } from 'nestjs-i18n';
import { I18nTranslations } from 'src/generated/i18n.generated';

@Injectable()
export class JwtTokenService {
  private readonly logger = new Logger(JwtTokenService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @InjectModel(EDbModelName.Token)
    private readonly tokenModel: Model<TokenDocument>,
    private readonly i18n: I18nService<I18nTranslations>,
  ) {}

  private async generateToken(
    userId: string,
    expires: dayjs.Dayjs,
    tokenType: ETokenType,
    secret = this.configService.get('JWT_SECRET_KEY'),
  ) {
    const payload = {
      sub: userId,
      iat: dayjs().unix(),
      exp: expires.unix(),
      type: tokenType,
    };
    return await this.jwtService.signAsync(payload, { secret });
  }

  private async saveToken(
    token: string,
    userId: string,
    expires: dayjs.Dayjs,
    tokenType: ETokenType,
    blacklisted = false,
  ) {
    const tokenDoc = await this.tokenModel.create({
      token,
      user: userId,
      expires: expires.toDate(),
      type: tokenType,
      blacklisted,
    });
    return tokenDoc;
  }

  async verifyToken(token: string, tokenType: ETokenType) {
    const payload = await this.jwtService.verifyAsync(token, {
      secret: this.configService.get('JWT_SECRET_KEY'),
    });
    const tokenDoc = await this.tokenModel.findOne({
      token,
      type: tokenType,
      user: payload.sub,
      blacklisted: false,
    });
    if (!tokenDoc) {
      throw new UnauthorizedException(this.i18n.t('message.tokenNotFound'));
    }
    return tokenDoc;
  }

  async deleteToken(refreshToken: any) {
    await this.tokenModel.deleteOne({ _id: refreshToken.id });
  }

  async generateAuthTokens(user: any): Promise<{
    access: {
      token: string;
      expires: Date;
    };
    refresh: {
      token: string;
      expires: Date;
    };
  }> {
    const accessTokenExpires = dayjs().add(
      this.configService.get('JWT_ACCESS_EXPIRATION_MINUTES'),
      'minutes',
    );
    const accessToken = await this.generateToken(
      user.id,
      accessTokenExpires,
      ETokenType.ACCESS,
    );

    const refreshTokenExpires = dayjs().add(
      this.configService.get('JWT_REFRESH_EXPIRATION_DAYS'),
      'days',
    );
    const refreshToken = await this.generateToken(
      user.id,
      refreshTokenExpires,
      ETokenType.REFRESH,
    );
    await this.saveToken(
      refreshToken,
      user.id,
      refreshTokenExpires,
      ETokenType.REFRESH,
    );

    return {
      access: {
        token: accessToken,
        expires: accessTokenExpires.toDate(),
      },
      refresh: {
        token: refreshToken,
        expires: refreshTokenExpires.toDate(),
      },
    };
  }
}
