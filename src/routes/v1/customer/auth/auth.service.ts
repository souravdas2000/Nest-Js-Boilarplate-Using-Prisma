import { EDbModelName } from '@modules/database/constants';
import { UserDocument } from '@modules/user/schemas/user.schema';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import {
  comparePassword,
  decryptOtp,
  encryptOtp,
  hashPassword,
} from '@common/helpers';
import { EmailService } from '@modules/email/services/email.service';
import {
  JwtTokenService,
  OtpService,
  SocialAuthVerifyService,
} from '@modules/auth/services';
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
import { ELoginType, ETokenType } from '@modules/auth/constants';
import { I18nService } from 'nestjs-i18n';
import { I18nTranslations } from 'src/generated/i18n.generated';
import { OtpDocument } from '@modules/auth/schemas/otp.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(EDbModelName.User)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(EDbModelName.Otp)
    private readonly otpModel: Model<OtpDocument>,
    private readonly configService: ConfigService,
    private readonly jwtTokenService: JwtTokenService,
    private readonly otpService: OtpService,
    private readonly emailService: EmailService,
    private readonly socialAuthVerifyService: SocialAuthVerifyService,
    private readonly i18n: I18nService<I18nTranslations>,
  ) {}

  /**
   * User registration
   * @param registerDto
   */
  async register(registerDto: RegisterDto) {
    const userData = await this.userModel.findOne({
      $or: [
        { user_name: registerDto.user_name },
        { email: registerDto.email.toLowerCase() },
      ],
      is_deleted: false,
      is_active: true,
    });

    // Check if user already registered
    if (userData) {
      throw new BadRequestException(
        this.i18n.t('message.userAlreadyExistWithThisEmailOrUsername'),
      );
    }

    const submitData = {
      first_name: registerDto.first_name,
      last_name: registerDto.last_name,
      user_name: registerDto.user_name,
      email: registerDto.email.toLowerCase(),
      date_of_birth: registerDto.date_of_birth,
      gender: registerDto.gender,
      password: await hashPassword(registerDto.password), // Hash password
      profile_picture: '',
    };

    // Create a new user
    const addUserData = await this.userModel.create(submitData);

    // Generate email verification OTP
    const otp = encryptOtp(
      await this.otpService.generateVerifyEmailOTP(addUserData.id),
    );

    const mailData = {
      to: addUserData.email,
      subject: 'Email Verification',
      template: 'email-verification',
      contextData: {
        name: `${addUserData.first_name} ${addUserData.last_name}`,
        link: `${this.configService.get('FRONTEND_URL')}verify_mail/?id=${otp}`,
      },
    };

    // Send email verification mail to the user
    await this.emailService.sendMail(mailData);

    return {
      message: this.i18n.t(
        'message.youAreSuccessfullyRegisteredPleaseVerifyYourEmail',
      ),
    };
  }

  /**
   * Verify email
   * @param emailVerificationDto
   */
  async verifyEmail(emailVerificationDto: EmailVerificationDto) {
    const otpData = await this.otpModel.findOne({
      otp: decryptOtp(emailVerificationDto.token),
    });

    // Check otp is exist or not and if it is then check it is expired or not
    if (!otpData || otpData.expires < new Date()) {
      throw new BadRequestException(this.i18n.t('message.linkHasBeenExpired'));
    }

    // Get user data from database
    const user = await this.userModel.findOne({
      _id: otpData.user,
      is_deleted: false,
      is_active: true,
    });

    // Check user is exist or not
    if (!user) {
      throw new BadRequestException(this.i18n.t('message.invalidUser'));
    }

    // Update user record to set email as verified
    await this.userModel.findByIdAndUpdate(user._id, {
      is_email_verified: true,
    });

    // Delete reset password OTP
    await this.otpModel.deleteOne({ otp: otpData.otp });

    // Generate JWT tokens for authentication
    const tokens = await this.jwtTokenService.generateAuthTokens(user);

    const updateObj = {
      last_login_time: new Date(),
    };

    // Update user record with last login time
    await this.userModel.findByIdAndUpdate(user._id, updateObj);

    user.last_login_time = updateObj.last_login_time;

    return {
      message: this.i18n.t('message.emailVerifiedSuccessfully'),
      data: { userData: user, tokens },
    };
  }

  /**
   * Resend link
   * @param resendLinkDto
   */
  async resendLink(resendLinkDto: ResendLinkDto) {
    const userData = await this.userModel.findOne({
      email: resendLinkDto.email.toLowerCase(),
      is_deleted: false,
      is_active: true,
    });

    // Check if is exist or not
    if (!userData) {
      throw new BadRequestException(this.i18n.t('message.invalidUser'));
    }

    // Check user is already verified
    if (userData.is_email_verified) {
      throw new BadRequestException(
        this.i18n.t('message.emailAlreadyVerified'),
      );
    }

    // Generate email verification OTP
    const otp = encryptOtp(
      await this.otpService.generateVerifyEmailOTP(userData.id),
    );

    const mailData = {
      to: userData.email,
      subject: 'Email Verification',
      template: 'email-verification',
      contextData: {
        name: `${userData.first_name} ${userData.last_name}`,
        link: `${this.configService.get('FRONTEND_URL')}verify_mail/?id=${otp}`,
      },
    };

    // Send email verification mail to the user
    await this.emailService.sendMail(mailData);

    return { message: this.i18n.t('message.mailSentSuccessfully') };
  }

  /**
   * User login
   * @param loginDto
   */
  async login(loginDto: LoginDto) {
    const userData = await this.userModel.findOne({
      email: loginDto.email.toLowerCase(),
    });

    // Check if user is exist with the email address
    if (!userData) {
      throw new BadRequestException(
        this.i18n.t('message.invalidLoginCredentials'),
      );
    }

    // Check if user is banned
    if (userData.is_banned) {
      throw new BadRequestException(
        this.i18n.t('message.yourAccountIsBannedPleaseContactAdminAt', {
          args: { supportEmail: this.configService.get('SUPPORT_EMAIL') },
        }),
      );
    }

    // Check if user is deleted
    if (userData.is_deleted) {
      throw new BadRequestException(this.i18n.t('message.invalidUser'));
    }

    // Check if user is inactive
    if (!userData.is_active) {
      throw new BadRequestException(
        this.i18n.t('message.yourAccountIsInactivePleaseContactAdminAt', {
          args: { supportEmail: this.configService.get('SUPPORT_EMAIL') },
        }),
      );
    }

    // Check if user's password is valid
    if (!(await comparePassword(loginDto.password, userData.password))) {
      throw new BadRequestException(this.i18n.t('message.invalidPassword'));
    }

    // Check if email is verified or not
    if (!userData.is_email_verified) {
      return {
        message: this.i18n.t('message.pleaseVerifyYourEmailToContinue'),
        data: { is_email_verified: false },
      };
    }

    // Generate JWT tokens for authentication
    const tokens = await this.jwtTokenService.generateAuthTokens(userData);

    const updateObj = {
      last_login_time: new Date(),
    };

    // Update user record with last login time
    await this.userModel.findByIdAndUpdate(userData._id, updateObj);

    userData.last_login_time = updateObj.last_login_time;

    return {
      message: this.i18n.t('message.youAreSignedInSuccessfully'),
      data: { userData, tokens },
    };
  }

  /**
   * User social login
   * @param socialLoginDto
   */
  async socialLogin(socialLoginDto: SocialLoginDto) {
    let user;
    if (socialLoginDto.type === ELoginType.FACEBOOK) {
      // Verify facebook token
      const response = await this.socialAuthVerifyService.verifyFacebookToken(
        socialLoginDto.token,
      );
      const { id, name, email } = response.data;
      const [firstName, ...lastNameParts] = name.split(' ');
      const lastName = lastNameParts.join(' ');

      user = await this.userModel.findOne({ email: email.toLowerCase() });

      // Check if user is not exist then create a new user
      if (!user) {
        user = await this.createUser({
          first_name: firstName,
          last_name: lastName,
          user_name: '',
          email: email,
          signup_by: ELoginType.FACEBOOK,
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

      user = await this.userModel.findOne({ email: payload.email });

      // Check if user is not exist then create a new user
      if (!user) {
        user = await this.createUser({
          first_name: payload.given_name,
          last_name: payload.family_name,
          user_name: '',
          email: payload.email,
          signup_by: ELoginType.GOOGLE,
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
    // Create a new user
    const newUser = await this.userModel.create(data);

    return newUser;
  }

  private async processUser(user: any) {
    // Check if user is banned
    if (user.is_banned) {
      throw new BadRequestException(
        this.i18n.t('message.yourAccountIsBannedPleaseContactAdminAt', {
          args: { supportEmail: this.configService.get('SUPPORT_EMAIL') },
        }),
      );
    }

    // Check if user is deleted
    if (user.is_deleted) {
      throw new BadRequestException(this.i18n.t('message.invalidUser'));
    }

    // Check if user is inactive
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

    // Update user record with last login time and email is verified
    await this.userModel.findByIdAndUpdate(user._id, user);

    return {
      message: this.i18n.t('message.youAreSignedInSuccessfully'),
      data: { userData: user, tokens },
    };
  }

  /**
   * User forgot password
   * @param forgotPasswordDto
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const userData = await this.userModel.findOne({
      email: forgotPasswordDto.email.toLowerCase(),
      is_deleted: false,
      is_active: true,
    });

    // Check user is exist or not
    if (!userData) {
      throw new BadRequestException(this.i18n.t('message.invalidUser'));
    }

    // Check if user is already verified
    if (!userData.is_email_verified) {
      throw new BadRequestException(
        this.i18n.t('message.pleaseVerifyYourEmailToContinue'),
      );
    }

    // Generate reset password OTP
    const otp = encryptOtp(
      await this.otpService.generateResetPasswordOTP(userData.id),
    );

    const mailData = {
      to: userData.email,
      subject: 'Forgot Password',
      template: 'forgot-password',
      contextData: {
        name: `${userData.first_name} ${userData.last_name}`,
        link: `${this.configService.get<string>('FRONTEND_URL')}reset_password/?id=${otp}`,
      },
    };

    // Send email with reset password link
    await this.emailService.sendMail(mailData);

    return { message: this.i18n.t('message.mailSentSuccessfully') };
  }

  /**
   * User reset password
   * @param resetPasswordDto
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const otpData = await this.otpModel.findOne({
      otp: decryptOtp(resetPasswordDto.token),
    });

    // Check otp is exist or not and if it is then check it is expired or not
    if (!otpData || otpData.expires < new Date()) {
      throw new BadRequestException(this.i18n.t('message.linkHasBeenExpired'));
    }

    const user = await this.userModel.findOne({
      _id: otpData.user,
      is_deleted: false,
      is_active: true,
    });

    // Check user is exist or not
    if (!user) {
      throw new BadRequestException(this.i18n.t('message.invalidUser'));
    }

    // Hash new password
    const hashedPassword = await hashPassword(resetPasswordDto.new_password);

    // Update user record with new password
    await this.userModel.findByIdAndUpdate(user._id, {
      password: hashedPassword,
    });

    // Delete reset password OTP
    await this.otpModel.deleteOne({ otp: otpData.otp });

    return { message: this.i18n.t('message.passwordResetSuccessfully') };
  }

  /**
   * User refresh tokens
   * @param refreshTokensDto
   */
  async refreshTokens(refreshTokensDto: RefreshTokensDto) {
    try {
      const refreshTokenDoc = await this.jwtTokenService.verifyToken(
        refreshTokensDto.refresh_token,
        ETokenType.REFRESH,
      );
      const user = await this.userModel.findById(refreshTokenDoc.user);
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
