import { ELoginType } from '@modules/auth/constants';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class SocialLoginDto {
  @ApiProperty({ example: 'asdsadasdasd8asdsds32saf51sdf' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ enum: ELoginType })
  @IsString()
  @IsEnum(ELoginType)
  @IsNotEmpty()
  type: ELoginType;
}
