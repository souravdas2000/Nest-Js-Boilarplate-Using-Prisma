import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { OAuth2Client } from 'google-auth-library';
import { I18nService } from 'nestjs-i18n';
import { I18nTranslations } from 'src/generated/i18n.generated';

@Injectable()
export class SocialAuthVerifyService {
  private readonly logger = new Logger(SocialAuthVerifyService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly i18n: I18nService<I18nTranslations>,
  ) {}

  async verifyFacebookToken(accessToken: string): Promise<any> {
    try {
      // Verify the access token using Facebook's Graph API
      const response = await axios.get(
        `https://graph.facebook.com/v15.0/me?fields=id,name,email&access_token=${accessToken}`,
      );
      return response.data;
    } catch (error) {
      // Token verification failed
      this.logger.error('Failed to verify Facebook token:', error.message);
      throw new InternalServerErrorException(
        this.i18n.t('message.failedToVerifyFacebookToken'),
      );
    }
  }

  async verifyGoogleToken(tokenData: any) {
    try {
      const oAuth2Client = new OAuth2Client(
        this.configService.get<string>('GOOGLE_CLIENT_ID'),
        this.configService.get<string>('GOOGLE_SECRET_ID'),
        'postmessage',
      );

      const { tokens } = await oAuth2Client.getToken(tokenData); // exchange code for tokens

      const ticket = await oAuth2Client.verifyIdToken({
        idToken: tokens.id_token,
        audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      });

      return ticket;
    } catch (error) {
      this.logger.error('Failed to verify Google token:', error.message);
      throw new InternalServerErrorException(
        this.i18n.t('message.failedToVerifyGoogleToken'),
      );
    }
  }
}
