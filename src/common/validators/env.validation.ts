import { IEnvConfig, EEnvironment } from '@common/constants';
import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator';

class EnvironmentVariables implements IEnvConfig {
  @IsEnum(EEnvironment)
  @IsNotEmpty()
  NODE_ENV: EEnvironment;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsNumber()
  @IsNotEmpty()
  PORT: number;

  @IsString()
  @IsNotEmpty()
  FRONTEND_URL: string;

  @IsString()
  @IsNotEmpty()
  ADMIN_URL: string;

  @IsString()
  @IsNotEmpty()
  HTTP_DOMAIN: string;

  @IsString()
  @IsNotEmpty()
  JWT_SECRET_KEY: string;

  @IsNumber()
  @IsNotEmpty()
  JWT_ACCESS_EXPIRATION_MINUTES: number;

  @IsNumber()
  @IsNotEmpty()
  JWT_REFRESH_EXPIRATION_DAYS: number;

  @IsNumber()
  @IsNotEmpty()
  EMAIL_OTP_EXPIRES_MINUTES: number;

  @IsNumber()
  @IsNotEmpty()
  PASSWORD_OTP_EXPIRES_MINUTES: number;

  @IsString()
  @IsNotEmpty()
  AWS_ACCESS_KEY_ID: string;

  @IsString()
  @IsNotEmpty()
  AWS_SECRET_ACCESS_KEY: string;

  @IsString()
  @IsNotEmpty()
  AWS_REGION: string;

  @IsString()
  @IsNotEmpty()
  AWS_S3_BUCKET: string;

  @IsString()
  @IsNotEmpty()
  GOOGLE_CLIENT_ID: string;

  @IsString()
  @IsNotEmpty()
  GOOGLE_SECRET_ID: string;

  @IsString()
  @IsNotEmpty()
  FACBOOK_CLIENT_ID: string;

  @IsString()
  @IsNotEmpty()
  FACBOOK_CLIENT_SECRET: string;

  @IsString()
  @IsNotEmpty()
  FROM: string;

  @IsString()
  @IsNotEmpty()
  SES_HOST: string;

  @IsNumber()
  @IsNotEmpty()
  SES_PORT: number;

  @IsString()
  @IsNotEmpty()
  SMTP_USERNAME: string;

  @IsString()
  @IsNotEmpty()
  SMTP_PASSWORD: string;

  @IsString()
  @IsNotEmpty()
  SWAGGER_USERNAME: string;

  @IsString()
  @IsNotEmpty()
  SWAGGER_USER_PASSWORD: string;

  @IsString()
  @IsNotEmpty()
  FALLBACK_LANGUAGE: string;

  @IsString()
  @IsNotEmpty()
  SUPPORT_EMAIL: string;

  @IsNumber()
  @IsOptional()
  PRISMA_SLOW_QUERY_THRESHOLD_MS?: number;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
