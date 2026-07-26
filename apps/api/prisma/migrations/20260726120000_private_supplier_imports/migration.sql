ALTER TABLE "product_imports"
  ALTER COLUMN "fileUrl" DROP NOT NULL,
  ADD COLUMN "storageKey" TEXT;

