import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatArs } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { PrintButton } from "@/components/PrintButton";

type PageProps = { params: { id: string } };

export default async function SalePrintPage({ params }: PageProps) {
  const [sale, settings] = await Promise.all([
    prisma.sale.findUnique({
      where: { id: params.id },
      include: { customer: true, items: { include: { product: true } } }
    }),
    getSettings()
  ]);

  if (!sale) {
    redirect("/admin/sales");
  }

  return (
    <section className="section container print-page">
      <div className="print-actions">
        <PrintButton />
      </div>
      <div className="print-card">
        <div className="print-header">
          <div>
            <h2>{settings.shopName}</h2>
            <p className="muted">Comprobante de venta</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p><strong>Venta #{sale.invoiceNumber || "-"}</strong></p>
            <p>{sale.createdAt.toLocaleDateString("es-AR")}</p>
          </div>
        </div>

        <div className="print-section">
          <p><strong>Cliente:</strong> {sale.customer?.name || "Sin cliente"}</p>
          <p><strong>Telefono:</strong> {sale.customer?.phone || "-"}</p>
          <p><strong>Vendedor:</strong> {sale.soldBy || "-"}</p>
          <p><strong>Canal:</strong> {sale.channel}</p>
          <p><strong>Pago:</strong> {sale.paymentMethod}</p>
          <p><strong>Envio:</strong> {sale.shippingMethod}</p>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item) => (
              <tr key={item.id}>
                <td>{item.product?.name || "Producto"}</td>
                <td>{item.quantity}</td>
                <td>{formatArs(item.priceArs)}</td>
                <td>{formatArs(item.priceArs * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="print-total">
          <p>Subtotal: {formatArs(sale.subtotalArs)}</p>
          <p><strong>Total: {formatArs(sale.totalArs)}</strong></p>
        </div>
      </div>
    </section>
  );
}
