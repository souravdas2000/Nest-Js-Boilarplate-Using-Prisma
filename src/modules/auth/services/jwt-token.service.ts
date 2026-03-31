import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import dayjs from 'dayjs';
import { ETokenType } from '../constants';
import { I18nService } from 'nestjs-i18n';
import { I18nTranslations } from 'src/generated/i18n.generated';
import { PrismaService } from '@modules/database';

@Injectable()
export class JwtTokenService {
  private readonly logger = new Logger(JwtTokenService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
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
    return this.prisma.token.create({
      data: {
        token,
        userId,
        expires: expires.toDate(),
        type: tokenType as any,
        blacklisted,
      },
    });
  }

  async verifyToken(token: string, tokenType: ETokenType) {
    const payload = await this.jwtService.verifyAsync<{ sub: string }>(token, {
      secret: this.configService.get('JWT_SECRET_KEY'),
    });
    const tokenDoc = await this.prisma.token.findFirst({
      where: {
        token,
        type: tokenType as any,
        userId: payload.sub,
        blacklisted: false,
      },
    });

    if (!tokenDoc) {
      throw new UnauthorizedException(this.i18n.t('message.tokenNotFound'));
    }
    return tokenDoc;
  }

  async deleteToken(refreshToken: { id: string }) {
    await this.prisma.token.delete({ where: { id: refreshToken.id } });
  }

  async generateAuthTokens(user: { id: string }): Promise<{
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
