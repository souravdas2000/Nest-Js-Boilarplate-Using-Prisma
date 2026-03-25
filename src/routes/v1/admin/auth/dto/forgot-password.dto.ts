import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class AdminForgotPasswordDto {
  @ApiProperty({ example: 'admin@yopmail.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
