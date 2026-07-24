-- Authentication and organization approval hardening.
ALTER TABLE "users" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);

-- Existing active accounts predate email verification and are treated as verified.
UPDATE "users"
SET "emailVerifiedAt" = COALESCE("updatedAt", "createdAt", CURRENT_TIMESTAMP)
WHERE "status" = 'ACTIVE';

ALTER TABLE "suppliers"
ADD COLUMN "rejectedAt" TIMESTAMP(3),
ADD COLUMN "rejectedBy" TEXT,
ADD COLUMN "rejectionNote" TEXT;

ALTER TABLE "pharmacies"
ADD COLUMN "rejectedAt" TIMESTAMP(3),
ADD COLUMN "rejectedBy" TEXT,
ADD COLUMN "rejectionNote" TEXT;

-- Client-generated mutation identity prepares checkout for safe retry/offline work.
ALTER TABLE "checkout_groups"
ADD COLUMN "createdByUserId" TEXT,
ADD COLUMN "clientMutationId" TEXT,
ADD COLUMN "deviceId" TEXT;

CREATE INDEX "checkout_groups_createdByUserId_idx"
ON "checkout_groups"("createdByUserId");

CREATE UNIQUE INDEX "checkout_groups_pharmacyId_clientMutationId_key"
ON "checkout_groups"("pharmacyId", "clientMutationId");

-- Auth/session records and checkout actors must reference real users.
DELETE FROM "refresh_tokens"
WHERE NOT EXISTS (
  SELECT 1 FROM "users" WHERE "users"."id" = "refresh_tokens"."userId"
);

DELETE FROM "email_verifications"
WHERE NOT EXISTS (
  SELECT 1 FROM "users" WHERE "users"."id" = "email_verifications"."userId"
);

DELETE FROM "password_resets"
WHERE NOT EXISTS (
  SELECT 1 FROM "users" WHERE "users"."id" = "password_resets"."userId"
);

ALTER TABLE "refresh_tokens"
ADD CONSTRAINT "refresh_tokens_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "email_verifications"
ADD CONSTRAINT "email_verifications_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "password_resets"
ADD CONSTRAINT "password_resets_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "checkout_groups"
ADD CONSTRAINT "checkout_groups_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- Prefixes repeat each year, so only the composite prefix/year key is valid.
DROP INDEX "sequences_prefix_key";

-- System audit events have no user row; preserve them with a nullable actor.
ALTER TABLE "audit_logs"
DROP CONSTRAINT "audit_logs_userId_fkey";

ALTER TABLE "audit_logs"
ALTER COLUMN "userId" DROP NOT NULL;

ALTER TABLE "audit_logs"
ADD CONSTRAINT "audit_logs_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
