# Prisma migration baseline

The repository originally used a Prisma schema without committed migration history.

## New databases

Run:

```bash
pnpm --filter @pharmasyn/api prisma migrate deploy
```

This applies the baseline followed by all incremental migrations.

## Existing PharmaSY development database

Before applying migrations, back up the database and confirm its schema matches the
pre-stabilization Prisma schema. Mark only the baseline as already applied, then deploy
the incremental migrations:

```bash
pnpm --filter @pharmasyn/api exec prisma migrate resolve --applied 20260723000100_baseline
pnpm --filter @pharmasyn/api exec prisma migrate deploy
```

Never run the E2E cleanup suite against this database. Tests require a dedicated database
whose name or schema contains `test`.
