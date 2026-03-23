export function formatCurrency(value: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(value);
}

export function formatUsd(value: number) {
  return formatCurrency(value, "USD", "en-US");
}

export function formatArs(value: number) {
  return formatCurrency(value, "ARS", "es-AR");
}

