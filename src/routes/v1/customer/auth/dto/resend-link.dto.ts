import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ResendLinkDto {
  @ApiProperty({ example: 'john@yopmail.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
