export interface IEnvConfig {
  NODE_ENV: EEnvironment;
  DATABASE_URL: string;
  PORT: number;
  FRONTEND_URL: string;
  ADMIN_URL: string;
  HTTP_DOMAIN: string;
  JWT_SECRET_KEY: string;
  JWT_ACCESS_EXPIRATION_MINUTES: number;
  JWT_REFRESH_EXPIRATION_DAYS: number;
  EMAIL_OTP_EXPIRES_MINUTES: number;
  PASSWORD_OTP_EXPIRES_MINUTES: number;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  AWS_REGION: string;
  AWS_S3_BUCKET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_SECRET_ID: string;
  FACBOOK_CLIENT_ID: string;
  FACBOOK_CLIENT_SECRET: string;
  FROM: string;
  SES_HOST: string;
  SES_PORT: number;
  SMTP_USERNAME: string;
  SMTP_PASSWORD: string;
  SWAGGER_USERNAME: string;
  SWAGGER_USER_PASSWORD: string;
  FALLBACK_LANGUAGE: string;
  SUPPORT_EMAIL: string;
}

export enum EEnvironment {
  PROD = 'PROD',
  DEV = 'DEV',
  TEST = 'TEST',
}
