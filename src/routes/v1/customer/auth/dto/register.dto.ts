import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  last_name: string;

  @ApiProperty({ example: 'john123' })
  @IsString()
  @IsNotEmpty()
  user_name: string;

  @ApiProperty({ example: 'john@yopmail.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '1990-02-28' })
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  date_of_birth: Date;

  @ApiProperty({ example: 'male' })
  @IsString()
  @IsNotEmpty()
  gender: string;

  @ApiProperty({ example: 'John@123' })
  @IsStrongPassword()
  @IsString()
  @IsNotEmpty()
  password: string;
}
