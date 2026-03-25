import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsStrongPassword } from 'class-validator';

export class AdminResetPasswordDto {
  @ApiProperty({ example: 'ffddca4eec0164a0a2ef82dcc98ca432' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'Admin@12345' })
  @IsStrongPassword()
  @IsString()
  @IsNotEmpty()
  new_password: string;
}
