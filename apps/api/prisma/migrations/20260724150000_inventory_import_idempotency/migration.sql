CREATE TABLE "inventory_import_mutations" (
    "id" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientMutationId" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_import_mutations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "inventory_import_mutations_pharmacyId_clientMutationId_key"
ON "inventory_import_mutations"("pharmacyId", "clientMutationId");

CREATE INDEX "inventory_import_mutations_pharmacyId_createdAt_idx"
ON "inventory_import_mutations"("pharmacyId", "createdAt");
