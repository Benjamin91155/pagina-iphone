import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getExchangeRate, getSettings } from "@/lib/settings";
import { formatArs, formatUsd } from "@/lib/format";
import { applyInstallments, usdToArs } from "@/lib/pricing";

async function createOnlineSale(formData: FormData) {
  "use server";

  const productSlug = String(formData.get("productSlug") || "");
  const quantityRaw = Number(formData.get("quantity") || 1);
  const quantity = Number.isFinite(quantityRaw) && quantityRaw > 0 ? quantityRaw : 1;
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const shippingMethod = String(formData.get("shippingMethod") || "RETIRO");
  const paymentMethod = String(formData.get("paymentMethod") || "EFECTIVO");

  const product = await prisma.product.findUnique({ where: { slug: productSlug } });
  if (!product || product.stock < quantity || !name || !phone) {
    redirect(`/checkout?product=${productSlug}&error=1`);
  }

  const settings = await getSettings();
  const exchangeRate = await getExchangeRate(settings);
  const cash = usdToArs(product.priceUsd, exchangeRate, settings.profitMarginPercent);
  const subtotalArs = cash * quantity;
  const totalArs =
    paymentMethod === "MERCADOPAGO"
      ? applyInstallments(subtotalArs, settings.installmentsFeePercent)
      : subtotalArs;

  let customer = await prisma.customer.findFirst({ where: { phone } });
  if (!customer) {
    customer = await prisma.customer.create({ data: { name, phone } });
  }

  const sale = await prisma.$transaction(async (tx) => {
    const lastInvoice = await tx.sale.aggregate({ _max: { invoiceNumber: true } });
    const invoiceNumber = (lastInvoice._max.invoiceNumber || 0) + 1;

    const created = await tx.sale.create({
      data: {
        channel: "ONLINE",
        paymentMethod: paymentMethod === "MERCADOPAGO" ? "MERCADOPAGO" : "EFECTIVO",
        shippingMethod: shippingMethod === "ENVIO" ? "ENVIO" : "RETIRO",
        status: "PENDIENTE",
        subtotalArs,
        totalArs,
        invoiceNumber,
        customerId: customer.id,
        items: {
          create: {
            productId: product.id,
            quantity,
            priceUsd: product.priceUsd,
            priceArs: cash
          }
        }
      }
    });

    await tx.product.update({
      where: { id: product.id },
      data: { stock: product.stock - quantity }
    });

    let remaining = quantity;
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
          reason: "Venta online",
          saleId: created.id,
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
          reason: "Venta online sin lote",
          saleId: created.id
        }
      });
    }

    return created;
  });

  redirect(`/checkout?product=${productSlug}&success=1&sale=${sale.id}`);
}

type PageProps = { searchParams?: { product?: string; success?: string; error?: string } };

export default async function CheckoutPage({ searchParams }: PageProps) {
  const productSlug = String(searchParams?.product || "");
  const success = searchParams?.success;
  const error = searchParams?.error;

  const product = productSlug
    ? await prisma.product.findUnique({ where: { slug: productSlug } })
    : null;

  const settings = await getSettings();
  const exchangeRate = await getExchangeRate(settings);
  const cash = product ? usdToArs(product.priceUsd, exchangeRate, settings.profitMarginPercent) : 0;
  const installmentsTotal = applyInstallments(cash, settings.installmentsFeePercent);
  const installmentsCount = Math.max(1, settings.installmentsCount);

  return (
    <section className="section container">
      <div className="admin-header">
        <div>
          <h2>Checkout</h2>
          <p className="muted">Confirmacion de compra y datos de envio.</p>
        </div>
      </div>

      {!product ? (
        <p className="muted">Selecciona un producto desde la tienda.</p>
      ) : (
        <div className="card" style={{ padding: 20, marginBottom: 24 }}>
          <h3>{product.name}</h3>
          <p className="muted">{product.model} {product.capacity || ""}</p>
          <div className="price-block">
            <span>Precio efectivo: {formatArs(cash)}</span>
            <small>USD base: {formatUsd(product.priceUsd)}</small>
            <small>
              Precio en cuotas: {installmentsCount} x {formatArs(installmentsTotal / installmentsCount)}
            </small>
          </div>
        </div>
      )}

      {success ? (
        <div className="info-panel">
          <strong>Pedido generado</strong>
          <p>Te contactamos para coordinar pago y envio.</p>
        </div>
      ) : null}

      {error ? <p className="muted">Revisa los datos o el stock disponible.</p> : null}

      {product ? (
        <form className="form-card" action={createOnlineSale}>
          <input type="hidden" name="productSlug" value={product.slug} />
          <div className="form-grid">
            <label>
              Nombre
              <input name="name" required />
            </label>
            <label>
              Telefono
              <input name="phone" required />
            </label>
            <label>
              Cantidad
              <input name="quantity" type="number" min="1" defaultValue="1" />
            </label>
            <label>
              Envio
              <select name="shippingMethod" defaultValue="RETIRO">
                <option value="RETIRO">Retiro en persona</option>
                <option value="ENVIO">Envio</option>
              </select>
            </label>
            <label>
              Pago
              <select name="paymentMethod" defaultValue="MERCADOPAGO">
                <option value="MERCADOPAGO">MercadoPago</option>
                <option value="EFECTIVO">Efectivo / Transferencia</option>
              </select>
            </label>
          </div>
          <button className="button" type="submit">Confirmar compra</button>
        </form>
      ) : null}
    </section>
  );
}

