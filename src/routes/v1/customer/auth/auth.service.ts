import {
  comparePassword,
  decryptOtp,
  encryptOtp,
  hashPassword,
} from '@common/helpers';
import { ELoginType, ETokenType } from '@modules/auth/constants';
import {
  JwtTokenService,
  OtpService,
  SocialAuthVerifyService,
} from '@modules/auth/services';
import { PrismaService } from '@modules/database';
import { EmailService } from '@modules/email/services/email.service';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { I18nTranslations } from 'src/generated/i18n.generated';
import {
  EmailVerificationDto,
  ForgotPasswordDto,
  LoginDto,
  RefreshTokensDto,
  RegisterDto,
  ResendLinkDto,
  ResetPasswordDto,
  SocialLoginDto,
} from './dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwtTokenService: JwtTokenService,
    private readonly otpService: OtpService,
    private readonly emailService: EmailService,
    private readonly socialAuthVerifyService: SocialAuthVerifyService,
    private readonly i18n: I18nService<I18nTranslations>,
  ) {}

  async register(registerDto: RegisterDto) {
    const userData = await this.prisma.user.findFirst({
      where: {
        OR: [
          { user_name: registerDto.user_name },
          { email: registerDto.email.toLowerCase() },
        ],
        is_deleted: false,
        is_active: true,
      },
    });

    if (userData) {
      throw new BadRequestException(
        this.i18n.t('message.userAlreadyExistWithThisEmailOrUsername'),
      );
    }

    let addUserData;

    try {
      addUserData = await this.prisma.user.create({
        data: {
          first_name: registerDto.first_name,
          last_name: registerDto.last_name,
          user_name: registerDto.user_name,
          email: registerDto.email.toLowerCase(),
          date_of_birth: registerDto.date_of_birth?.toISOString(),
          gender: registerDto.gender,
          password: await hashPassword(registerDto.password),
          profile_picture: '',
        },
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        this.throwUserAlreadyExists();
      }
      throw error;
    }

    const otp = encryptOtp(
      await this.otpService.generateVerifyEmailOTP(addUserData.id),
    );

    await this.emailService.sendMail({
      to: addUserData.email,
      subject: 'Email Verification',
      template: 'email-verification',
      contextData: {
        name: `${addUserData.first_name} ${addUserData.last_name}`,
        link: `${this.configService.get('FRONTEND_URL')}verify_mail/?id=${otp}`,
      },
    });

    return {
      message: this.i18n.t(
        'message.youAreSuccessfullyRegisteredPleaseVerifyYourEmail',
      ),
    };
  }

  async verifyEmail(emailVerificationDto: EmailVerificationDto) {
    const otpData = await this.prisma.otp.findFirst({
      where: { otp: decryptOtp(emailVerificationDto.token) },
    });

    if (!otpData || otpData.expires < new Date()) {
      throw new BadRequestException(this.i18n.t('message.linkHasBeenExpired'));
    }

    const user = await this.prisma.user.findFirst({
      where: {
        id: otpData.userId,
        is_deleted: false,
        is_active: true,
      },
    });

    if (!user) {
      throw new BadRequestException(this.i18n.t('message.invalidUser'));
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { is_email_verified: true },
    });

    await this.prisma.otp.deleteMany({ where: { otp: otpData.otp } });

    const tokens = await this.jwtTokenService.generateAuthTokens(user);
    const last_login_time = new Date();

    await this.prisma.user.update({
      where: { id: user.id },
      data: { last_login_time },
    });
    user.last_login_time = last_login_time;

    return {
      message: this.i18n.t('message.emailVerifiedSuccessfully'),
      data: { userData: user, tokens },
    };
  }

  async resendLink(resendLinkDto: ResendLinkDto) {
    const userData = await this.prisma.user.findFirst({
      where: {
        email: resendLinkDto.email.toLowerCase(),
        is_deleted: false,
        is_active: true,
      },
    });

    if (!userData) {
      throw new BadRequestException(this.i18n.t('message.invalidUser'));
    }

    if (userData.is_email_verified) {
      throw new BadRequestException(
        this.i18n.t('message.emailAlreadyVerified'),
      );
    }

    const otp = encryptOtp(
      await this.otpService.generateVerifyEmailOTP(userData.id),
    );

    await this.emailService.sendMail({
      to: userData.email,
      subject: 'Email Verification',
      template: 'email-verification',
      contextData: {
        name: `${userData.first_name} ${userData.last_name}`,
        link: `${this.configService.get('FRONTEND_URL')}verify_mail/?id=${otp}`,
      },
    });

    return { message: this.i18n.t('message.mailSentSuccessfully') };
  }

  async login(loginDto: LoginDto) {
    const userData = await this.prisma.user.findFirst({
      where: { email: loginDto.email.toLowerCase() },
    });

    if (!userData) {
      throw new BadRequestException(
        this.i18n.t('message.invalidLoginCredentials'),
      );
    }

    if (userData.is_banned) {
      throw new BadRequestException(
        this.i18n.t('message.yourAccountIsBannedPleaseContactAdminAt', {
          args: { supportEmail: this.configService.get('SUPPORT_EMAIL') },
        }),
      );
    }

    if (userData.is_deleted) {
      throw new BadRequestException(this.i18n.t('message.invalidUser'));
    }

    if (!userData.is_active) {
      throw new BadRequestException(
        this.i18n.t('message.yourAccountIsInactivePleaseContactAdminAt', {
          args: { supportEmail: this.configService.get('SUPPORT_EMAIL') },
        }),
      );
    }

    if (!(await comparePassword(loginDto.password, userData.password))) {
      throw new BadRequestException(this.i18n.t('message.invalidPassword'));
    }

    if (!userData.is_email_verified) {
      return {
        message: this.i18n.t('message.pleaseVerifyYourEmailToContinue'),
        data: { is_email_verified: false },
      };
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

  async socialLogin(socialLoginDto: SocialLoginDto) {
    let user;

    if (socialLoginDto.type === ELoginType.FACEBOOK) {
      const response = await this.socialAuthVerifyService.verifyFacebookToken(
        socialLoginDto.token,
      );
      const { id, name, email } = response.data;
      const [firstName, ...lastNameParts] = name.split(' ');
      const lastName = lastNameParts.join(' ');

      user = await this.prisma.user.findFirst({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        user = await this.createUser({
          first_name: firstName,
          last_name: lastName,
          user_name: '',
          email,
          signup_by: ELoginType.FACEBOOK as any,
          is_email_verified: true,
          social_id: id,
          profile_picture: '',
          date_of_birth: '',
          gender: '',
          password: '',
        });
      }
    } else if (socialLoginDto.type === ELoginType.GOOGLE) {
      const response = await this.socialAuthVerifyService.verifyGoogleToken(
        socialLoginDto.token,
      );
      const payload = response.getPayload();

      user = await this.prisma.user.findFirst({
        where: { email: payload.email },
      });

      if (!user) {
        user = await this.createUser({
          first_name: payload.given_name,
          last_name: payload.family_name,
          user_name: '',
          email: payload.email,
          signup_by: ELoginType.GOOGLE as any,
          is_email_verified: true,
          social_id: payload.sub,
          profile_picture: payload.picture,
          date_of_birth: '',
          gender: '',
          password: '',
        });
      }
    }

    return this.processUser(user);
  }

  private async createUser(data: any) {
    try {
      return await this.prisma.user.create({ data });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        return this.prisma.user.findFirst({
          where: { email: data.email.toLowerCase() },
        });
      }
      throw error;
    }
  }

  private isUniqueConstraintError(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }

  private throwUserAlreadyExists(): never {
    throw new BadRequestException(
      this.i18n.t('message.userAlreadyExistWithThisEmailOrUsername'),
    );
  }

  private async processUser(user: any) {
    if (user.is_banned) {
      throw new BadRequestException(
        this.i18n.t('message.yourAccountIsBannedPleaseContactAdminAt', {
          args: { supportEmail: this.configService.get('SUPPORT_EMAIL') },
        }),
      );
    }

    if (user.is_deleted) {
      throw new BadRequestException(this.i18n.t('message.invalidUser'));
    }

    if (!user.is_active) {
      throw new BadRequestException(
        this.i18n.t('message.yourAccountIsInactivePleaseContactAdminAt', {
          args: { supportEmail: this.configService.get('SUPPORT_EMAIL') },
        }),
      );
    }

    const tokens = await this.jwtTokenService.generateAuthTokens(user);

    user.last_login_time = new Date();
    user.is_email_verified = true;

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        last_login_time: user.last_login_time,
        is_email_verified: true,
      },
    });

    return {
      message: this.i18n.t('message.youAreSignedInSuccessfully'),
      data: { userData: user, tokens },
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const userData = await this.prisma.user.findFirst({
      where: {
        email: forgotPasswordDto.email.toLowerCase(),
        is_deleted: false,
        is_active: true,
      },
    });

    if (!userData) {
      throw new BadRequestException(this.i18n.t('message.invalidUser'));
    }

    if (!userData.is_email_verified) {
      throw new BadRequestException(
        this.i18n.t('message.pleaseVerifyYourEmailToContinue'),
      );
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
        link: `${this.configService.get<string>('FRONTEND_URL')}reset_password/?id=${otp}`,
      },
    });

    return { message: this.i18n.t('message.mailSentSuccessfully') };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const otpData = await this.prisma.otp.findFirst({
      where: { otp: decryptOtp(resetPasswordDto.token) },
    });

    if (!otpData || otpData.expires < new Date()) {
      throw new BadRequestException(this.i18n.t('message.linkHasBeenExpired'));
    }

    const user = await this.prisma.user.findFirst({
      where: {
        id: otpData.userId,
        is_deleted: false,
        is_active: true,
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

  async refreshTokens(refreshTokensDto: RefreshTokensDto) {
    try {
      const refreshTokenDoc = await this.jwtTokenService.verifyToken(
        refreshTokensDto.refresh_token,
        ETokenType.REFRESH,
      );
      const user = await this.prisma.user.findUnique({
        where: { id: refreshTokenDoc.userId },
      });

      if (!user) {
        throw new UnauthorizedException();
      }

      await this.jwtTokenService.deleteToken(refreshTokenDoc);
      const tokens = await this.jwtTokenService.generateAuthTokens(user);

      return {
        message: this.i18n.t('message.success'),
        data: { tokens },
      };
    } catch (error) {
      throw new UnauthorizedException(
        this.i18n.t('message.pleaseAuthenticate'),
      );
    }
  }
}
