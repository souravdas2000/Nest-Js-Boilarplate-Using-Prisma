-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'customer');

-- CreateEnum
CREATE TYPE "SignupBy" AS ENUM ('custom', 'google', 'facebook');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('private', 'public');

-- CreateEnum
CREATE TYPE "OtpType" AS ENUM ('verify_email', 'reset_password');

-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('access', 'refresh');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "user_name" TEXT,
    "email" TEXT NOT NULL,
    "date_of_birth" TEXT,
    "password" TEXT NOT NULL DEFAULT '',
    "social_id" TEXT,
    "gender" TEXT,
    "signup_by" "SignupBy" NOT NULL DEFAULT 'custom',
    "last_login_time" TIMESTAMP(3),
    "about" TEXT,
    "profile_picture" TEXT NOT NULL DEFAULT '',
    "cover_picture" TEXT,
    "video_picture" TEXT,
    "facebook_profile" TEXT,
    "twitter_profile" TEXT,
    "instagram_profile" TEXT,
    "youtube_profile" TEXT,
    "customer_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "is_accept_term_condition" BOOLEAN NOT NULL DEFAULT true,
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "account_type" "AccountType" NOT NULL DEFAULT 'public',
    "is_account_private" BOOLEAN NOT NULL DEFAULT false,
    "is_show_followers" BOOLEAN NOT NULL DEFAULT true,
    "is_show_friends" BOOLEAN NOT NULL DEFAULT true,
    "is_show_likes" BOOLEAN NOT NULL DEFAULT true,
    "user_location" TEXT,
    "is_live" BOOLEAN NOT NULL DEFAULT false,
    "letterbox" TEXT,
    "is_banned" BOOLEAN NOT NULL DEFAULT false,
    "banned_start_time" TIMESTAMP(3),
    "banned_end_time" TIMESTAMP(3),
    "role" "Role" NOT NULL DEFAULT 'customer',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otps" (
    "id" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "OtpType" NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "TokenType" NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "blacklisted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_user_name_idx" ON "users"("user_name");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_is_deleted_is_active_idx" ON "users"("is_deleted", "is_active");

-- CreateIndex
CREATE INDEX "users_is_deleted_is_active_role_idx" ON "users"("is_deleted", "is_active", "role");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_user_name_key" ON "users"("user_name");

-- CreateIndex
CREATE INDEX "otps_otp_idx" ON "otps"("otp");

-- CreateIndex
CREATE INDEX "otps_user_id_type_idx" ON "otps"("user_id", "type");

-- CreateIndex
CREATE INDEX "otps_user_id_type_expires_idx" ON "otps"("user_id", "type", "expires");

-- CreateIndex
CREATE INDEX "tokens_token_idx" ON "tokens"("token");

-- CreateIndex
CREATE INDEX "tokens_user_id_type_blacklisted_idx" ON "tokens"("user_id", "type", "blacklisted");

-- CreateIndex
CREATE INDEX "tokens_user_id_type_blacklisted_expires_idx" ON "tokens"("user_id", "type", "blacklisted", "expires");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_token_key" ON "tokens"("token");

-- AddForeignKey
ALTER TABLE "otps" ADD CONSTRAINT "otps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
