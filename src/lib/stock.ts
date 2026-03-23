import { prisma } from "./db";

type StockMovementInput = {
  productId: string;
  type: string;
  quantity: number;
  reason?: string | null;
  saleId?: string | null;
  repairOrderId?: string | null;
  lotId?: string | null;
};

export async function createStockMovement(input: StockMovementInput) {
  const quantity = Math.abs(Math.trunc(input.quantity));
  if (!quantity) return null;

  return prisma.stockMovement.create({
    data: {
      productId: input.productId,
      type: input.type,
      quantity,
      reason: input.reason || null,
      saleId: input.saleId || null,
      repairOrderId: input.repairOrderId || null,
      lotId: input.lotId || null
    }
  });
}

export async function addStockLot(params: {
  productId: string;
  code: string;
  quantity: number;
  costUsd?: number | null;
  notes?: string | null;
  reason?: string | null;
}) {
  const quantity = Math.trunc(params.quantity);
  if (!quantity) return null;

  return prisma.$transaction(async (tx) => {
    const lot = await tx.stockLot.create({
      data: {
        productId: params.productId,
        code: params.code,
        quantity,
        remaining: quantity,
        costUsd: Number.isFinite(params.costUsd ?? NaN) ? Number(params.costUsd) : null,
        notes: params.notes || null
      }
    });

    await tx.product.update({
      where: { id: params.productId },
      data: { stock: { increment: quantity } }
    });

    await tx.stockMovement.create({
      data: {
        productId: params.productId,
        type: "IN",
        quantity,
        reason: params.reason || "Ingreso de lote",
        lotId: lot.id
      }
    });

    return lot;
  });
}

export async function consumeStockFromLots(params: {
  productId: string;
  quantity: number;
  saleId?: string | null;
  reason?: string | null;
}) {
  let remaining = Math.trunc(params.quantity);
  if (remaining <= 0) return { remaining: 0 };

  const lots = await prisma.stockLot.findMany({
    where: { productId: params.productId, remaining: { gt: 0 } },
    orderBy: { receivedAt: "asc" }
  });

  for (const lot of lots) {
    if (remaining <= 0) break;
    const take = Math.min(lot.remaining, remaining);
    remaining -= take;

    await prisma.stockLot.update({
      where: { id: lot.id },
      data: { remaining: lot.remaining - take }
    });

    await prisma.stockMovement.create({
      data: {
        productId: params.productId,
        type: "OUT",
        quantity: take,
        reason: params.reason || "Venta",
        saleId: params.saleId || null,
        lotId: lot.id
      }
    });
  }

  if (remaining > 0) {
    await prisma.stockMovement.create({
      data: {
        productId: params.productId,
        type: "OUT",
        quantity: remaining,
        reason: params.reason || "Venta sin lote",
        saleId: params.saleId || null
      }
    });
  }

  return { remaining };
}
