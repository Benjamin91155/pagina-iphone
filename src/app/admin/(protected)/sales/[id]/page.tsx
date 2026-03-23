import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatArs } from "@/lib/format";

type PageProps = { params: { id: string } };

export default async function SaleDetailPage({ params }: PageProps) {
  const sale = await prisma.sale.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
      items: { include: { product: true } }
    }
  });

  if (!sale) {
    redirect("/admin/sales");
  }

  return (
    <section>
      <div className="admin-header">
        <div>
          <h2>Venta #{sale.invoiceNumber || "-"}</h2>
          <p className="muted">{sale.createdAt.toLocaleDateString("es-AR")}</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Link className="button secondary" href={`/admin/sales/${sale.id}/print`}>
            Imprimir
          </Link>
          <Link className="button" href="/admin/sales">
            Volver
          </Link>
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <p><strong>Cliente:</strong> {sale.customer?.name || "Sin cliente"}</p>
        <p><strong>Telefono:</strong> {sale.customer?.phone || "-"}</p>
        <p><strong>Vendedor:</strong> {sale.soldBy || "-"}</p>
        <p><strong>Canal:</strong> {sale.channel}</p>
        <p><strong>Pago:</strong> {sale.paymentMethod}</p>
        <p><strong>Envio:</strong> {sale.shippingMethod}</p>
        <p><strong>Estado:</strong> {sale.status}</p>
      </div>

      <div className="card" style={{ padding: 12 }}>
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
      </div>

      <div className="section" style={{ paddingTop: 16 }}>
        <div className="info-panel">
          <p>Subtotal: {formatArs(sale.subtotalArs)}</p>
          <p><strong>Total: {formatArs(sale.totalArs)}</strong></p>
        </div>
      </div>
    </section>
  );
}
