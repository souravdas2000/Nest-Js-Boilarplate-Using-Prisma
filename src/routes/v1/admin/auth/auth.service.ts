import {
  comparePassword,
  decryptOtp,
  encryptOtp,
  hashPassword,
} from '@common/helpers';
import { JwtTokenService, OtpService } from '@modules/auth/services';
import { PrismaService } from '@modules/database';
import { EmailService } from '@modules/email/services';
import { ERole } from '@modules/user/constants';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { I18nTranslations } from 'src/generated/i18n.generated';
import {
  AdminForgotPasswordDto,
  AdminLoginDto,
  AdminResetPasswordDto,
} from './dto';
import { AdminRegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtTokenService: JwtTokenService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly i18n: I18nService<I18nTranslations>,
    private readonly otpService: OtpService,
  ) {}

  async adminInitialCheck() {
    const userData = await this.prisma.user.findFirst({
      where: { role: ERole.ADMIN as any },
      select: { id: true },
    });

    return {
      message: this.i18n.t('message.success'),
      data: { hasAdmin: !!userData },
    };
  }

  async register(registerDto: AdminRegisterDto) {
    const userData = await this.prisma.user.findFirst({
      where: { email: registerDto.email.toLowerCase() },
      select: { id: true },
    });

    if (userData) {
      throw new BadRequestException(
        this.i18n.t('message.userAlreadyExistWithThisEmailOrUsername'),
      );
    }

    try {
      await this.prisma.user.create({
        data: {
          first_name: registerDto.first_name,
          last_name: registerDto.last_name,
          email: registerDto.email.toLowerCase(),
          password: await hashPassword(registerDto.password),
          role: ERole.ADMIN as any,
        },
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new BadRequestException(
          this.i18n.t('message.userAlreadyExistWithThisEmailOrUsername'),
        );
      }
      throw error;
    }

    return {
      message: this.i18n.t('message.youAreSuccessfullyRegistered'),
    };
  }

  async login(loginDto: AdminLoginDto) {
    const userData = await this.prisma.user.findFirst({
      where: {
        email: loginDto.email.toLowerCase(),
        role: ERole.ADMIN as any,
      },
    });

    if (!userData) {
      throw new BadRequestException(
        this.i18n.t('message.invalidLoginCredentials'),
      );
    }

    if (!(await comparePassword(loginDto.password, userData.password))) {
      throw new BadRequestException(this.i18n.t('message.invalidPassword'));
    }

    const tokens = await this.jwtTokenService.generateAuthTokens(userData);

    const last_login_time = new Date();
    await this.prisma.user.update({
      where: { id: userData.id },
      data: { last_login_time },
    });
    userData.last_login_time = last_login_time;

    return {
      message: this.i18n.t('message.youAreSignedInSuccessfully'),
      data: { userData, tokens },
    };
  }

  async forgotPassword(forgotPasswordDto: AdminForgotPasswordDto) {
    const userData = await this.prisma.user.findFirst({
      where: {
        email: forgotPasswordDto.email.toLowerCase(),
        role: ERole.ADMIN as any,
      },
    });

    if (!userData) {
      throw new BadRequestException(this.i18n.t('message.invalidUser'));
    }

    const otp = encryptOtp(
      await this.otpService.generateResetPasswordOTP(userData.id),
    );

    await this.emailService.sendMail({
      to: userData.email,
      subject: 'Forgot Password',
      template: 'forgot-password',
      contextData: {
        name: `${userData.first_name} ${userData.last_name}`,
        link: `${this.configService.get<string>('ADMIN_URL')}reset_password/?id=${otp}`,
      },
    });

    return { message: this.i18n.t('message.mailSentSuccessfully') };
  }

  async resetPassword(resetPasswordDto: AdminResetPasswordDto) {
    const otpData = await this.prisma.otp.findFirst({
      where: { otp: decryptOtp(resetPasswordDto.token) },
    });

    if (!otpData || otpData.expires < new Date()) {
      throw new BadRequestException(this.i18n.t('message.linkHasBeenExpired'));
    }

    const user = await this.prisma.user.findFirst({
      where: {
        id: otpData.userId,
        role: ERole.ADMIN as any,
      },
    });

    if (!user) {
      throw new BadRequestException(this.i18n.t('message.invalidUser'));
    }

    const hashedPassword = await hashPassword(resetPasswordDto.new_password);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    await this.prisma.otp.deleteMany({ where: { otp: otpData.otp } });

    return { message: this.i18n.t('message.passwordResetSuccessfully') };
  }

  private isUniqueConstraintError(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
