import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type SequenceClient = Pick<PrismaService, 'sequence'> | Pick<Prisma.TransactionClient, 'sequence'>;
export type DocumentPrefix = 'PSY' | 'CHK' | 'SAL' | 'RET' | 'CAN';

export async function generateOrderNumber(
  prisma: SequenceClient,
  prefix: DocumentPrefix,
): Promise<string> {
  const year = new Date().getUTCFullYear();
  const sequence = await prisma.sequence.upsert({
    where: { prefix_year: { prefix, year } },
    update: { current: { increment: 1 } },
    create: { prefix, year, current: 1 },
  });

  return `${prefix}-${year}-${String(sequence.current).padStart(6, '0')}`;
}
