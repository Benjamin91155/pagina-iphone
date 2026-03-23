import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { getCustomerFromSession } from "@/lib/customer-auth";
import { formatArs } from "@/lib/format";

export default async function CustomerSalesPage() {
  const token = cookies().get("customer_session")?.value;
  const customer = await getCustomerFromSession(token);

  if (!customer) return null;

  const sales = await prisma.sale.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" }
  });

  return (
    <section className="section container">
      <h2>Mis compras</h2>
      <div className="card" style={{ padding: 12 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>#</th>
              <th>Canal</th>
              <th>Pago</th>
              <th>Total</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id}>
                <td>{sale.createdAt.toLocaleDateString("es-AR")}</td>
                <td>{sale.invoiceNumber || "-"}</td>
                <td>{sale.channel}</td>
                <td>{sale.paymentMethod}</td>
                <td>{formatArs(sale.totalArs)}</td>
                <td>{sale.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {sales.length === 0 ? <p className="muted">Aun no tienes compras.</p> : null}
      </div>
    </section>
  );
}
