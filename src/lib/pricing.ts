export function roundPrice(value: number) {
  return Math.round(value / 10) * 10;
}

export function applyMargin(usd: number, marginPercent: number) {
  return usd * (1 + marginPercent / 100);
}

export function usdToArs(usd: number, rate: number, marginPercent: number) {
  const withMargin = applyMargin(usd, marginPercent);
  return roundPrice(withMargin * rate);
}

export function applyInstallments(ars: number, feePercent: number) {
  return roundPrice(ars * (1 + feePercent / 100));
}

