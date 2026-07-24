-- DropForeignKey
ALTER TABLE "product_imports" DROP CONSTRAINT "product_imports_supplierId_fkey";

-- AlterTable
ALTER TABLE "product_imports" ADD COLUMN     "pharmacyId" TEXT,
ALTER COLUMN "supplierId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "product_imports_pharmacyId_idx" ON "product_imports"("pharmacyId");

-- AddForeignKey
ALTER TABLE "product_imports" ADD CONSTRAINT "product_imports_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_imports" ADD CONSTRAINT "product_imports_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "pharmacies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
