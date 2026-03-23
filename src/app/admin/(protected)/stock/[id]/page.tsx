import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatUsd } from "@/lib/format";

function buildLotCode() {
  return `LOT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

async function addLot(productId: string, formData: FormData) {
  "use server";

  const codeRaw = String(formData.get("code") || "").trim();
  const code = codeRaw || buildLotCode();
  const quantity = Number(formData.get("quantity") || 0);
  const costUsd = Number(formData.get("costUsd") || 0);
  const notes = String(formData.get("notes") || "").trim();

  if (!quantity || quantity <= 0) {
    redirect(`/admin/stock/${productId}?error=lot`);
  }

  await prisma.$transaction(async (tx) => {
    const lot = await tx.stockLot.create({
      data: {
        productId,
        code,
        quantity,
        remaining: quantity,
        costUsd: Number.isFinite(costUsd) && costUsd > 0 ? costUsd : null,
        notes: notes || null
      }
    });

    await tx.product.update({
      where: { id: productId },
      data: { stock: { increment: quantity } }
    });

    await tx.stockMovement.create({
      data: {
        productId,
        type: "IN",
        quantity,
        reason: "Ingreso de lote",
        lotId: lot.id
      }
    });
  });

  redirect(`/admin/stock/${productId}`);
}

async function adjustStock(productId: string, formData: FormData) {
  "use server";

  const adjustment = Number(formData.get("adjustment") || 0);
  const reason = String(formData.get("reason") || "").trim() || "Ajuste manual";

  if (!adjustment) {
    redirect(`/admin/stock/${productId}?error=adjust`);
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { stock: true }
  });

  if (!product) {
    redirect("/admin/stock");
  }

  const nextStock = product.stock + adjustment;
  if (nextStock < 0) {
    redirect(`/admin/stock/${productId}?error=stock`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: productId },
      data: { stock: nextStock }
    });

    await tx.stockMovement.create({
      data: {
        productId,
        type: adjustment >= 0 ? "IN" : "OUT",
        quantity: Math.abs(adjustment),
        reason
      }
    });
  });

  redirect(`/admin/stock/${productId}`);
}

type PageProps = { params: { id: string }; searchParams?: { error?: string } };

export default async function StockDetailPage({ params, searchParams }: PageProps) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      lots: { orderBy: { receivedAt: "desc" } },
      movements: { orderBy: { createdAt: "desc" }, include: { sale: true, lot: true } }
    }
  });

  if (!product) {
    redirect("/admin/stock");
  }

  const error = searchParams?.error;

  return (
    <section>
      <div className="admin-header">
        <div>
          <h2>Stock - {product.name}</h2>
          <p className="muted">
            Stock actual: {product.stock} / Minimo: {product.minStock}
          </p>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        <form className="form-card" action={addLot.bind(null, product.id)}>
          <h3>Agregar lote</h3>
          <label>
            Codigo de lote
            <input name="code" placeholder="LOT-XXXX" />
          </label>
          <label>
            Cantidad
            <input name="quantity" type="number" min="1" step="1" required />
          </label>
          <label>
            Costo USD (opcional)
            <input name="costUsd" type="number" min="0" step="0.01" />
          </label>
          <label>
            Notas
            <input name="notes" placeholder="Proveedor, factura, etc." />
          </label>
          {error === "lot" ? <p className="muted">Completa la cantidad.</p> : null}
          <button className="button" type="submit">Guardar lote</button>
        </form>

        <form className="form-card" action={adjustStock.bind(null, product.id)}>
          <h3>Ajuste manual</h3>
          <label>
            Ajuste (+/-)
            <input name="adjustment" type="number" step="1" placeholder="Ej: -1 o 5" required />
          </label>
          <label>
            Motivo
            <input name="reason" placeholder="Inventario, daño, etc." />
          </label>
          {error === "adjust" ? <p className="muted">Indica un valor distinto de cero.</p> : null}
          {error === "stock" ? <p className="muted">El ajuste no puede dejar stock negativo.</p> : null}
          <button className="button" type="submit">Aplicar ajuste</button>
        </form>
      </div>

      <div className="section" style={{ paddingTop: 20 }}>
        <h3>Lotes</h3>
        <div className="card" style={{ padding: 12 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Codigo</th>
                <th>Ingreso</th>
                <th>Qty</th>
                <th>Restante</th>
                <th>Costo</th>
                <th>Notas</th>
              </tr>
            </thead>
            <tbody>
              {product.lots.map((lot) => (
                <tr key={lot.id}>
                  <td>{lot.code}</td>
                  <td>{lot.receivedAt.toLocaleDateString("es-AR")}</td>
                  <td>{lot.quantity}</td>
                  <td>{lot.remaining}</td>
                  <td>{lot.costUsd ? formatUsd(lot.costUsd) : "-"}</td>
                  <td>{lot.notes || "-"}</td>
                </tr>
              ))}
              {product.lots.length === 0 ? (
                <tr>
                  <td colSpan={6} className="muted">Sin lotes cargados.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="section">
        <h3>Movimientos recientes</h3>
        <div className="card" style={{ padding: 12 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Cantidad</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {product.movements.slice(0, 20).map((movement) => (
                <tr key={movement.id}>
                  <td>{movement.createdAt.toLocaleDateString("es-AR")}</td>
                  <td>{movement.type}</td>
                  <td>{movement.quantity}</td>
                  <td>
                    {movement.reason || "-"}
                    {movement.sale?.invoiceNumber ? ` · Venta #${movement.sale.invoiceNumber}` : ""}
                    {movement.lot?.code ? ` · Lote ${movement.lot.code}` : ""}
                  </td>
                </tr>
              ))}
              {product.movements.length === 0 ? (
                <tr>
                  <td colSpan={4} className="muted">Sin movimientos registrados.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
