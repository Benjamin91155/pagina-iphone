import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

async function deleteCustomer(customerId: string) {
  "use server";

  await prisma.$transaction(async (tx) => {
    const sales = await tx.sale.findMany({
      where: { customerId },
      select: { id: true }
    });
    const saleIds = sales.map((sale) => sale.id);
    if (saleIds.length) {
      await tx.stockMovement.deleteMany({ where: { saleId: { in: saleIds } } });
      await tx.saleItem.deleteMany({ where: { saleId: { in: saleIds } } });
      await tx.sale.deleteMany({ where: { id: { in: saleIds } } });
    }

    const repairs = await tx.repairOrder.findMany({
      where: { customerId },
      select: { id: true }
    });
    const repairIds = repairs.map((repair) => repair.id);
    if (repairIds.length) {
      await tx.repairUpdate.deleteMany({ where: { repairOrderId: { in: repairIds } } });
      await tx.stockMovement.deleteMany({ where: { repairOrderId: { in: repairIds } } });
      await tx.repairOrder.deleteMany({ where: { id: { in: repairIds } } });
    }

    await tx.customerSession.deleteMany({ where: { customerId } });
    await tx.customerUser.deleteMany({ where: { customerId } });
    await tx.customer.delete({ where: { id: customerId } });
  });

  redirect("/admin/customers");
}

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
                <td>
                  <form action={deleteCustomer.bind(null, customer.id)}>
                    <button className="button danger" type="submit">Borrar</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

