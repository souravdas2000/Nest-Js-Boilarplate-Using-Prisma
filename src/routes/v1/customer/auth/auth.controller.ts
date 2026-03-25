import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ResponseHelper } from '@common/helpers';
import { Response } from 'express';
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
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Customer Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'User registration' })
  @Post('register')
  async register(@Body() registerDto: RegisterDto, @Res() res: Response) {
    const { message } = await this.authService.register(registerDto);
    return ResponseHelper.success(res, { message }, HttpStatus.CREATED);
  }

  @ApiOperation({ summary: 'Email verification' })
  @Post('email-verification')
  async verifyEmail(
    @Body() emailVerificationDto: EmailVerificationDto,
    @Res() res: Response,
  ) {
    const result = await this.authService.verifyEmail(emailVerificationDto);
    return ResponseHelper.success(res, result);
  }

  @ApiOperation({ summary: 'Resend email verification link' })
  @Post('resend-link')
  async resendLink(@Body() resendLinkDto: ResendLinkDto, @Res() res: Response) {
    const { message } = await this.authService.resendLink(resendLinkDto);
    return ResponseHelper.success(res, { message });
  }

  @ApiOperation({ summary: 'Login' })
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    const result = await this.authService.login(loginDto);
    return ResponseHelper.success(res, result);
  }

  @ApiOperation({ summary: 'Social login' })
  @Post('social-login')
  async socialLogin(
    @Body() socialLoginDto: SocialLoginDto,
    @Res() res: Response,
  ) {
    const result = await this.authService.socialLogin(socialLoginDto);
    return ResponseHelper.success(res, result);
  }

  @ApiOperation({ summary: 'Forgot password' })
  @Post('forgot-password')
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
    @Res() res: Response,
  ) {
    const { message } =
      await this.authService.forgotPassword(forgotPasswordDto);
    return ResponseHelper.success(res, { message });
  }

  @ApiOperation({ summary: 'Reset password' })
  @Post('reset-password')
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Res() res: Response,
  ) {
    const { message } = await this.authService.resetPassword(resetPasswordDto);
    return ResponseHelper.success(res, { message });
  }

  @ApiOperation({ summary: 'Refresh tokens' })
  @Post('refresh-tokens')
  async refreshTokens(
    @Body() refreshTokensDto: RefreshTokensDto,
    @Res() res: Response,
  ) {
    const result = await this.authService.refreshTokens(refreshTokensDto);
    return ResponseHelper.success(res, result);
  }
}
