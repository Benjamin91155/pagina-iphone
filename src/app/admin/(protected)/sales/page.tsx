import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatArs } from "@/lib/format";

export default async function AdminSalesPage() {
  const sales = await prisma.sale.findMany({
    orderBy: { createdAt: "desc" },
    include: { customer: true }
  });

  return (
    <section>
      <div className="admin-header">
        <div>
          <h2>Ventas</h2>
          <p className="muted">Ventas online y en local.</p>
        </div>
        <Link className="button" href="/admin/sales/new">Nueva venta</Link>
      </div>

      <div className="card" style={{ padding: 12 }}>
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Cliente</th>
              <th>Vendedor</th>
              <th>Canal</th>
              <th>Pago</th>
              <th>Total</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id}>
                <td>{sale.invoiceNumber || "-"}</td>
                <td>{sale.customer?.name || "Sin cliente"}</td>
                <td>{sale.soldBy || "-"}</td>
                <td>{sale.channel}</td>
                <td>{sale.paymentMethod}</td>
                <td>{formatArs(sale.totalArs)}</td>
                <td>{sale.status}</td>
                <td>
                  <Link className="button secondary" href={`/admin/sales/${sale.id}`}>
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

