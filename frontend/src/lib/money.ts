export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
}

export function dollarsToCents(dollars: string): number {
  const parsed = Number(dollars);
  if (!Number.isFinite(parsed)) {
    throw new Error('Amount must be a number');
  }
  return Math.round(parsed * 100);
}
