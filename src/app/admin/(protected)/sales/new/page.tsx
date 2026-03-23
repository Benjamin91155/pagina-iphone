import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getExchangeRate, getSettings } from "@/lib/settings";
import { usdToArs, applyInstallments } from "@/lib/pricing";

async function createSale(formData: FormData) {
  "use server";

  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const soldBy = String(formData.get("soldBy") || "").trim();
  const channel = String(formData.get("channel") || "LOCAL");
  const paymentMethod = String(formData.get("paymentMethod") || "EFECTIVO");
  const shippingMethod = String(formData.get("shippingMethod") || "RETIRO");

  if (!name || !phone) {
    redirect("/admin/sales/new?error=1");
  }

  const items = [];
  for (let i = 0; i < 5; i += 1) {
    const productId = String(formData.get(`productId_${i}`) || "");
    const quantityRaw = Number(formData.get(`quantity_${i}`) || 0);
    const quantity = Number.isFinite(quantityRaw) ? quantityRaw : 0;
    if (productId && quantity > 0) {
      items.push({ productId, quantity });
    }
  }

  if (items.length === 0) {
    redirect("/admin/sales/new?error=1");
  }

  const settings = await getSettings();
  const exchangeRate = await getExchangeRate(settings);

  let customer = await prisma.customer.findFirst({ where: { phone } });
  if (!customer) {
    customer = await prisma.customer.create({ data: { name, phone } });
  }

  await prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({
      where: { id: { in: items.map((item) => item.productId) } }
    });

    let subtotalArs = 0;
    const saleItems = [];

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product || product.stock < item.quantity) {
        redirect("/admin/sales/new?error=stock");
      }
      const cash = usdToArs(product.priceUsd, exchangeRate, settings.profitMarginPercent);
      subtotalArs += cash * item.quantity;
      saleItems.push({
        productId: product.id,
        quantity: item.quantity,
        priceUsd: product.priceUsd,
        priceArs: cash
      });
    }

    const totalArs =
      paymentMethod === "MERCADOPAGO"
        ? applyInstallments(subtotalArs, settings.installmentsFeePercent)
        : subtotalArs;

    const lastInvoice = await tx.sale.aggregate({ _max: { invoiceNumber: true } });
    const invoiceNumber = (lastInvoice._max.invoiceNumber || 0) + 1;

    const sale = await tx.sale.create({
      data: {
        channel: channel === "ONLINE" ? "ONLINE" : "LOCAL",
        paymentMethod: paymentMethod === "MERCADOPAGO" ? "MERCADOPAGO" : "EFECTIVO",
        shippingMethod: shippingMethod === "ENVIO" ? "ENVIO" : "RETIRO",
        status: "COMPLETADA",
        subtotalArs,
        totalArs,
        invoiceNumber,
        soldBy: soldBy || null,
        customerId: customer.id,
        items: {
          create: saleItems
        }
      }
    });

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) continue;

      await tx.product.update({
        where: { id: product.id },
        data: { stock: product.stock - item.quantity }
      });

      let remaining = item.quantity;
      const lots = await tx.stockLot.findMany({
        where: { productId: product.id, remaining: { gt: 0 } },
        orderBy: { receivedAt: "asc" }
      });

      for (const lot of lots) {
        if (remaining <= 0) break;
        const take = Math.min(lot.remaining, remaining);
        remaining -= take;
        await tx.stockLot.update({
          where: { id: lot.id },
          data: { remaining: lot.remaining - take }
        });
        await tx.stockMovement.create({
          data: {
            productId: product.id,
            type: "OUT",
            quantity: take,
            reason: "Venta",
            saleId: sale.id,
            lotId: lot.id
          }
        });
      }

      if (remaining > 0) {
        await tx.stockMovement.create({
          data: {
            productId: product.id,
            type: "OUT",
            quantity: remaining,
            reason: "Venta sin lote",
            saleId: sale.id
          }
        });
      }
    }
  });

  redirect("/admin/sales");
}

type PageProps = { searchParams?: { error?: string } };

export default async function NewSalePage({ searchParams }: PageProps) {
  const products = await prisma.product.findMany({ orderBy: { name: "asc" } });
  const error = searchParams?.error;

  return (
    <section>
      <div className="admin-header">
        <div>
          <h2>Nueva venta</h2>
          <p className="muted">Registra ventas locales u online.</p>
        </div>
      </div>

      <form className="form-card" action={createSale}>
        <div className="form-grid">
          <label>
            Cliente
            <input name="name" required />
          </label>
          <label>
            Telefono
            <input name="phone" required />
          </label>
          <label>
            Vendedor
            <input name="soldBy" placeholder="Nombre del vendedor" />
          </label>
          <label>
            Canal
            <select name="channel" defaultValue="LOCAL">
              <option value="LOCAL">Local</option>
              <option value="ONLINE">Online</option>
            </select>
          </label>
          <label>
            Envio
            <select name="shippingMethod" defaultValue="RETIRO">
              <option value="RETIRO">Retiro</option>
              <option value="ENVIO">Envio</option>
            </select>
          </label>
          <label>
            Pago
            <select name="paymentMethod" defaultValue="EFECTIVO">
              <option value="EFECTIVO">Efectivo / Transferencia</option>
              <option value="MERCADOPAGO">MercadoPago</option>
            </select>
          </label>
        </div>

        <div>
          <h3>Items</h3>
          {[0, 1, 2, 3, 4].map((index) => (
            <div className="form-grid" key={index}>
              <label>
                Producto
                <select name={`productId_${index}`} defaultValue="">
                  <option value="">Seleccionar...</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.stock})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Cantidad
                <input name={`quantity_${index}`} type="number" min="0" defaultValue="0" />
              </label>
            </div>
          ))}
        </div>

        {error ? <p className="muted">Revisa datos o stock.</p> : null}
        <button className="button" type="submit">Guardar venta</button>
      </form>
    </section>
  );
}

