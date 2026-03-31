/*
  Warnings:

  - You are about to drop the `error_logs` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "error_logs" DROP CONSTRAINT "error_logs_user_id_fkey";

-- DropTable
DROP TABLE "error_logs";

-- CreateTable
CREATE TABLE "errorLogs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "status_code" INTEGER,
    "error_name" TEXT,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "method" TEXT,
    "path" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "request_body" TEXT,
    "request_query" TEXT,
    "request_params" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "errorLogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT,
    "description" TEXT,
    "old_values" TEXT,
    "new_values" TEXT,
    "metadata" TEXT,
    "method" TEXT,
    "path" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "errorLogs_created_at_idx" ON "errorLogs"("created_at");

-- CreateIndex
CREATE INDEX "errorLogs_status_code_idx" ON "errorLogs"("status_code");

-- CreateIndex
CREATE INDEX "errorLogs_path_idx" ON "errorLogs"("path");

-- CreateIndex
CREATE INDEX "errorLogs_user_id_idx" ON "errorLogs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs"("entity");

-- CreateIndex
CREATE INDEX "audit_logs_entity_id_idx" ON "audit_logs"("entity_id");

-- AddForeignKey
ALTER TABLE "errorLogs" ADD CONSTRAINT "errorLogs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
