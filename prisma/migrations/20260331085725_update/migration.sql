/*
  Warnings:

  - You are about to drop the `audit_logs` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_user_id_fkey";

-- DropTable
DROP TABLE "audit_logs";

-- CreateTable
CREATE TABLE "auditLogs" (
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

    CONSTRAINT "auditLogs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "auditLogs_created_at_idx" ON "auditLogs"("created_at");

-- CreateIndex
CREATE INDEX "auditLogs_user_id_idx" ON "auditLogs"("user_id");

-- CreateIndex
CREATE INDEX "auditLogs_action_idx" ON "auditLogs"("action");

-- CreateIndex
CREATE INDEX "auditLogs_entity_idx" ON "auditLogs"("entity");

-- CreateIndex
CREATE INDEX "auditLogs_entity_id_idx" ON "auditLogs"("entity_id");

-- AddForeignKey
ALTER TABLE "auditLogs" ADD CONSTRAINT "auditLogs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
