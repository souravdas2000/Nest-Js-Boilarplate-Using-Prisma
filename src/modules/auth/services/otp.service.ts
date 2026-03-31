import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';
import { I18nTranslations } from 'src/generated/i18n.generated';
import { EOtpType } from '../constants';
import dayjs from 'dayjs';
import { PrismaService } from '@modules/database';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
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
    let existingOtp: { id: string } | null;

    do {
      otp = Array.from({ length: 6 }, () =>
        Math.floor(Math.random() * 10),
      ).join('');
      existingOtp = await this.prisma.otp.findFirst({
        where: { otp },
        select: { id: true },
      });
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
    const userOtpData = await this.prisma.otp.findFirst({
      where: {
        userId,
        type: otpType as any,
      },
      select: { id: true },
    });

    if (userOtpData) {
      await this.prisma.otp.update({
        where: { id: userOtpData.id },
        data: { otp, expires: expires.toDate() },
      });
    } else {
      await this.prisma.otp.create({
        data: {
          userId,
          otp,
          type: otpType as any,
          expires: expires.toDate(),
        },
      });
    }
  }
}
