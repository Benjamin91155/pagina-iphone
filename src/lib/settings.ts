import { prisma } from "./db";
import type { Setting } from "@prisma/client";

export async function getSettings() {
  const existing = await prisma.setting.findFirst();
  if (existing) return existing;

  return prisma.setting.create({
    data: {
      exchangeRateMode: "manual",
      exchangeRate: 1000,
      profitMarginPercent: 0,
      installmentsFeePercent: 0,
      installmentsCount: 3,
      whatsappNumber: "5491111111111",
      shopName: "iPhone Lab"
    }
  });
}

function getByPath(source: Record<string, any>, path: string) {
  if (!source || !path) return undefined;
  return path.split(".").reduce((acc, key) => (acc ? acc[key] : undefined), source);
}

async function fetchAutoExchangeRate(settings: Setting) {
  const url = settings.exchangeRateApiUrl || process.env.EXCHANGE_RATE_API_URL;
  if (!url) return null;

  const res = await fetch(url, { next: { revalidate: 120 } });
  if (!res.ok) return null;

  const data = await res.json();
  const field = settings.exchangeRateApiField || process.env.EXCHANGE_RATE_API_FIELD;
  if (field) {
    const value = Number(getByPath(data, field));
    return Number.isFinite(value) ? value : null;
  }

  const candidates = [
    data?.venta,
    data?.sell,
    data?.value_sell,
    data?.rate,
    data?.usd,
    data?.blue?.value_sell
  ];
  const match = candidates.find((value) => Number.isFinite(Number(value)));
  return match ? Number(match) : null;
}

export async function getExchangeRate(settings?: Setting) {
  const activeSettings = settings ?? (await getSettings());
  if (activeSettings.exchangeRateMode === "auto") {
    const auto = await fetchAutoExchangeRate(activeSettings);
    if (auto) return auto;
  }
  return activeSettings.exchangeRate;
}

