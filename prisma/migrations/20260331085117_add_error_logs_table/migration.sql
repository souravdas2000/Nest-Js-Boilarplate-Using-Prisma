-- CreateTable
CREATE TABLE "error_logs" (
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

    CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "error_logs_created_at_idx" ON "error_logs"("created_at");

-- CreateIndex
CREATE INDEX "error_logs_status_code_idx" ON "error_logs"("status_code");

-- CreateIndex
CREATE INDEX "error_logs_path_idx" ON "error_logs"("path");

-- CreateIndex
CREATE INDEX "error_logs_user_id_idx" ON "error_logs"("user_id");

-- AddForeignKey
ALTER TABLE "error_logs" ADD CONSTRAINT "error_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
