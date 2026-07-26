const UNIT_IN_MILLISECONDS = {
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
} as const;

export function parseTokenDuration(
  value: string | undefined,
  fallback: string,
): number {
  const match = /^(\d+)([smhd])$/.exec(value?.trim() ?? '');
  if (match) {
    return (
      Number(match[1]) *
      UNIT_IN_MILLISECONDS[match[2] as keyof typeof UNIT_IN_MILLISECONDS]
    );
  }

  const fallbackMatch = /^(\d+)([smhd])$/.exec(fallback);
  if (!fallbackMatch) {
    throw new Error(`Invalid token duration fallback: ${fallback}`);
  }
  return (
    Number(fallbackMatch[1]) *
    UNIT_IN_MILLISECONDS[fallbackMatch[2] as keyof typeof UNIT_IN_MILLISECONDS]
  );
}
