import { Body, Controller, Get, HttpStatus, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ResponseHelper } from '@common/helpers';
import { Response } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AdminForgotPasswordDto,
  AdminLoginDto,
  AdminResetPasswordDto,
} from './dto';
import { AdminRegisterDto } from './dto/register.dto';

@ApiTags('Admin Auth')
@Controller('admin/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Check if admin is exist or not' })
  @Get('admin-initial-check')
  async adminInitialCheck(@Res() res: Response) {
    const result = await this.authService.adminInitialCheck();
    return ResponseHelper.success(res, result);
  }

  @ApiOperation({ summary: 'Admin registration' })
  @Post('register')
  async register(@Body() registerDto: AdminRegisterDto, @Res() res: Response) {
    const { message } = await this.authService.register(registerDto);
    return ResponseHelper.success(res, { message }, HttpStatus.CREATED);
  }

  @ApiOperation({ summary: 'Login' })
  @Post('login')
  async login(@Body() loginDto: AdminLoginDto, @Res() res: Response) {
    const result = await this.authService.login(loginDto);
    return ResponseHelper.success(res, result);
  }

  @ApiOperation({ summary: 'Forgot password' })
  @Post('forgot-password')
  async forgotPassword(
    @Body() forgotPasswordDto: AdminForgotPasswordDto,
    @Res() res: Response,
  ) {
    const { message } =
      await this.authService.forgotPassword(forgotPasswordDto);
    return ResponseHelper.success(res, { message });
  }

  @ApiOperation({ summary: 'Reset password' })
  @Post('reset-password')
  async resetPassword(
    @Body() resetPasswordDto: AdminResetPasswordDto,
    @Res() res: Response,
  ) {
    const { message } = await this.authService.resetPassword(resetPasswordDto);
    return ResponseHelper.success(res, { message });
  }
}
