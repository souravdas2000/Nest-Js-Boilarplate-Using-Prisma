import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokensDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5c' })
  @IsNotEmpty()
  @IsString()
  refresh_token: string;
}
