CREATE TYPE "ReportType" AS ENUM (
  'PHARMACY_POS_SALES',
  'PHARMACY_POS_RETURNS',
  'SUPPLIER_SALES',
  'C2C_EXCHANGE',
  'ORDERS_FULFILLMENT',
  'INVENTORY_VALUE',
  'INVENTORY_MOVEMENTS',
  'LOW_STOCK',
  'EXPIRY',
  'PRODUCT_CATEGORY_PERFORMANCE'
);

CREATE TYPE "ReportExportFormat" AS ENUM ('XLSX', 'PDF');
CREATE TYPE "ReportLocale" AS ENUM ('AR', 'EN');
CREATE TYPE "ReportExportStatus" AS ENUM (
  'QUEUED',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'EXPIRED'
);

CREATE TABLE "report_exports" (
  "id" TEXT NOT NULL,
  "requestedByUserId" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "orgRole" "UserRole" NOT NULL,
  "reportType" "ReportType" NOT NULL,
  "format" "ReportExportFormat" NOT NULL,
  "locale" "ReportLocale" NOT NULL,
  "filters" JSONB NOT NULL,
  "requestHash" TEXT NOT NULL,
  "clientRequestId" TEXT,
  "status" "ReportExportStatus" NOT NULL DEFAULT 'QUEUED',
  "progress" INTEGER NOT NULL DEFAULT 0,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "rowCount" INTEGER,
  "storageKey" TEXT,
  "fileName" TEXT,
  "contentType" TEXT,
  "errorMessage" TEXT,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "report_exports_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "report_exports_requestedByUserId_fkey"
    FOREIGN KEY ("requestedByUserId") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "report_exports_requestedByUserId_clientRequestId_key"
  ON "report_exports"("requestedByUserId", "clientRequestId");
CREATE INDEX "report_exports_orgId_status_idx"
  ON "report_exports"("orgId", "status");
CREATE INDEX "report_exports_requestedByUserId_createdAt_idx"
  ON "report_exports"("requestedByUserId", "createdAt");
CREATE INDEX "report_exports_status_createdAt_idx"
  ON "report_exports"("status", "createdAt");
