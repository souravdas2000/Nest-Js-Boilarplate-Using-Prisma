import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class EmailVerificationDto {
  @ApiProperty({ example: 'ffddca4eec0164a0a2ef82dcc98ca432' })
  @IsString()
  @IsNotEmpty()
  token: string;
}
