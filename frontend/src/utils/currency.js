const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export function formatUSD(value) {
  const n = Number(value);
  return usd.format(Number.isFinite(n) ? n : 0);
}
