# Project Run Guide

This guide explains how to set up, run, test, and push this NestJS + Prisma codebase.

## 1. Prerequisites

- Node.js `>=18`
- npm `>=9`
- PostgreSQL running and reachable from your machine

Check versions:

```bash
node -v
npm -v
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Configure Environment

Create/update `.env` in project root.

Minimum required values:

```env
NODE_ENV=DEV
PORT=3000
HTTP_DOMAIN=http://localhost:3000
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<db>?schema=public

JWT_SECRET_KEY=<your-secret>
JWT_ACCESS_EXPIRATION_MINUTES=30
JWT_REFRESH_EXPIRATION_DAYS=7

FRONTEND_URL=http://localhost:5173/
ADMIN_URL=http://localhost:5174/
SUPPORT_EMAIL=support@example.com

EMAIL_OTP_EXPIRES_MINUTES=10
PASSWORD_OTP_EXPIRES_MINUTES=10

FACBOOK_CLIENT_ID=replace_me
FACBOOK_CLIENT_SECRET=replace_me
GOOGLE_CLIENT_ID=replace_me
GOOGLE_SECRET_ID=replace_me

AWS_ACCESS_KEY_ID=replace_me
AWS_SECRET_ACCESS_KEY=replace_me
AWS_REGION=us-east-1
AWS_S3_BUCKET=replace_me

FROM=no-reply@example.com
SES_HOST=smtp.mailtrap.io
SES_PORT=2525
SMTP_USERNAME=replace_me
SMTP_PASSWORD=replace_me

SWAGGER_USERNAME=admin
SWAGGER_USER_PASSWORD=admin123
FALLBACK_LANGUAGE=en
```

Optional:

```env
PRISMA_SLOW_QUERY_THRESHOLD_MS=500
```

## 4. Prisma Setup (Required)

Generate client:

```bash
npx prisma generate
```

Run migrations:

```bash
npx prisma migrate dev
```

If schema changed and you want a named migration:

```bash
npx prisma migrate dev --name <migration_name>
```

## 5. Run Project

Development:

```bash
npm run start:dev
```

Standard start:

```bash
npm run start
```

Production:

```bash
npm run build
npm run start:prod
```

## 6. Base URLs

- App: `http://localhost:3000`
- API prefix: `http://localhost:3000/api/v1`
- Health endpoint: `GET http://localhost:3000/api/v1/health`

## 7. Testing

Run unit tests:

```bash
npm run test
```

Run CI-style tests (passes even if no tests found):

```bash
npm run test:ci
```

Run e2e tests:

```bash
npm run test:e2e
```

## 8. Lint/Format

```bash
npm run lint
npm run format
```

## 9. Husky + Git Flow

This project uses Husky hooks:

- `pre-commit`: runs `lint-staged`
- `commit-msg`: runs commitlint (Conventional Commits)
- `pre-push`: runs build + tests

Standard commit flow:

```bash
git status
git add .
git commit -m "feat(scope): short description"
git push
```

## 10. Troubleshooting

### `localhost refused to connect`
- App is not running, or startup failed.
- Check:
  - `npm run start:dev` logs
  - `DATABASE_URL` is reachable
  - `PORT` is correct in `.env`

### `No tests found` during push
- Already handled by `test:ci` using `--passWithNoTests`.

### Prisma model exists but table missing
- Run migration:

```bash
npx prisma migrate dev
```
