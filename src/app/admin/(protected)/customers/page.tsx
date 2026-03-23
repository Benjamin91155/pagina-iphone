import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function AdminCustomersPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { sales: true, repairs: true } }
    }
  });

  return (
    <section>
      <div className="admin-header">
        <div>
          <h2>Clientes</h2>
          <p className="muted">Historial de compras y reparaciones.</p>
        </div>
        <Link className="button" href="/admin/customers/new">Nuevo cliente</Link>
      </div>

      <div className="card" style={{ padding: 12 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Telefono</th>
              <th>Compras</th>
              <th>Reparaciones</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.name}</td>
                <td>{customer.phone}</td>
                <td>{customer._count.sales}</td>
                <td>{customer._count.repairs}</td>
                <td>
                  <Link className="button secondary" href={`/admin/customers/${customer.id}`}>
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

