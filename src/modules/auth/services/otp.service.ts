import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { EDbModelName } from '@modules/database/constants';
import { Model } from 'mongoose';
import { I18nService } from 'nestjs-i18n';
import { I18nTranslations } from 'src/generated/i18n.generated';
import { OtpDocument } from '../schemas/otp.schema';
import { EOtpType } from '../constants';
import dayjs from 'dayjs';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(EDbModelName.Otp)
    private readonly otpModel: Model<OtpDocument>,
    private readonly i18n: I18nService<I18nTranslations>,
  ) {}

  /**
   * Generate verify email OTP
   * @param userId
   */
  async generateVerifyEmailOTP(userId: string) {
    const otp = await this.generateUniqueOtp();
    const otpType = EOtpType.VERIFY_EMAIL;
    const otpExpires = dayjs().add(
      this.configService.get('EMAIL_OTP_EXPIRES_MINUTES'),
      'minutes',
    );
    await this.saveOtp(userId, otp, otpType, otpExpires);
    return otp;
  }

  /**
   * Generate reset password OTP
   * @param userId
   */
  async generateResetPasswordOTP(userId: string) {
    const otp = await this.generateUniqueOtp();
    const otpType = EOtpType.RESET_PASSWORD;
    const otpExpires = dayjs().add(
      this.configService.get('PASSWORD_OTP_EXPIRES_MINUTES'),
      'minutes',
    );
    await this.saveOtp(userId, otp, otpType, otpExpires);
    return otp;
  }

  async generateUniqueOtp(): Promise<string> {
    let otp: string;
    let existingOtp: OtpDocument | null;

    do {
      otp = Array.from({ length: 6 }, () =>
        Math.floor(Math.random() * 10),
      ).join('');
      existingOtp = await this.otpModel.findOne({ otp });
    } while (existingOtp);

    return otp;
  }

  /**
   * Save OTP in the DB
   * @param userId
   * @param otp
   * @param otpType
   */
  private async saveOtp(
    userId: string,
    otp: string,
    otpType: EOtpType,
    expires: dayjs.Dayjs,
  ) {
    const userOtpData = await this.otpModel.findOne({
      user: userId,
      type: otpType,
    });
    if (userOtpData) {
      await this.otpModel.updateOne(
        { user: userId, type: otpType },
        { otp, expires },
      );
    } else {
      await this.otpModel.create({ user: userId, otp, type: otpType, expires });
    }
  }
}
