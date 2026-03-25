import {
  comparePassword,
  decryptOtp,
  encryptOtp,
  hashPassword,
} from '@common/helpers';
import { JwtTokenService, OtpService } from '@modules/auth/services';
import { EDbModelName } from '@modules/database/constants';
import { EmailService } from '@modules/email/services';
import { UserDocument } from '@modules/user/schemas/user.schema';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AdminForgotPasswordDto,
  AdminLoginDto,
  AdminResetPasswordDto,
} from './dto';
import { ERole } from '@modules/user/constants';
import { I18nService } from 'nestjs-i18n';
import { I18nTranslations } from 'src/generated/i18n.generated';
import { OtpDocument } from '@modules/auth/schemas/otp.schema';
import { AdminRegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(EDbModelName.User)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(EDbModelName.Otp)
    private readonly otpModel: Model<OtpDocument>,
    private readonly jwtTokenService: JwtTokenService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly i18n: I18nService<I18nTranslations>,
    private readonly otpService: OtpService,
  ) {}
  /**
   * Check if admin is exist or not
   */
  async adminInitialCheck() {
    const userData = await this.userModel.findOne({
      role: ERole.ADMIN,
    });

    return {
      message: this.i18n.t('message.success'),
      data: { hasAdmin: !!userData },
    };
  }

  /**
   * Admin registration
   * @param registerDto
   */
  async register(registerDto: AdminRegisterDto) {
    const userData = await this.userModel.findOne({
      email: registerDto.email.toLowerCase(),
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
      email: registerDto.email.toLowerCase(),
      password: await hashPassword(registerDto.password), // Hash password
      role: ERole.ADMIN,
    };

    // Create a new admin
    await this.userModel.create(submitData);

    return {
      message: this.i18n.t('message.youAreSuccessfullyRegistered'),
    };
  }

  /**
   * Admin login
   * @param loginDto
   */
  async login(loginDto: AdminLoginDto) {
    const userData = await this.userModel.findOne({
      email: loginDto.email.toLowerCase(),
      role: ERole.ADMIN,
    });

    // Check if user is exist with the email address
    if (!userData) {
      throw new BadRequestException(
        this.i18n.t('message.invalidLoginCredentials'),
      );
    }

    // Check if user's password is valid
    if (!(await comparePassword(loginDto.password, userData.password))) {
      throw new BadRequestException(this.i18n.t('message.invalidPassword'));
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

  async forgotPassword(forgotPasswordDto: AdminForgotPasswordDto) {
    const userData = await this.userModel.findOne({
      email: forgotPasswordDto.email.toLowerCase(),
      role: ERole.ADMIN,
    });

    // Check user is exist or not
    if (!userData) {
      throw new BadRequestException(this.i18n.t('message.invalidUser'));
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
        link: `${this.configService.get<string>('ADMIN_URL')}reset_password/?id=${otp}`,
      },
    };

    // Send email with reset password link
    await this.emailService.sendMail(mailData);

    return { message: this.i18n.t('message.mailSentSuccessfully') };
  }

  async resetPassword(resetPasswordDto: AdminResetPasswordDto) {
    const otpData = await this.otpModel.findOne({
      otp: decryptOtp(resetPasswordDto.token),
    });

    // Check otp is exist or not and if it is then check it is expired or not
    if (!otpData || otpData.expires < new Date()) {
      throw new BadRequestException(this.i18n.t('message.linkHasBeenExpired'));
    }

    const user = await this.userModel.findOne({
      _id: otpData.user,
      role: ERole.ADMIN,
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
}
