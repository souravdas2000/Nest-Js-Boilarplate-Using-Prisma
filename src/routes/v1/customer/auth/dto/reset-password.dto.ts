import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsStrongPassword } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'ffddca4eec0164a0a2ef82dcc98ca432' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'John@123' })
  @IsStrongPassword()
  @IsString()
  @IsNotEmpty()
  new_password: string;
}
