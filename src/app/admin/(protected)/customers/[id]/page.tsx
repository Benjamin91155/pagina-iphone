import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatArs } from "@/lib/format";
import { REPAIR_STATUS_LABELS } from "@/lib/repair";
import Link from "next/link";

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

type PageProps = { params: { id: string } };

export default async function CustomerDetailPage({ params }: PageProps) {
  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
    include: {
      sales: { orderBy: { createdAt: "desc" } },
      repairs: { orderBy: { createdAt: "desc" } }
    }
  });

  if (!customer) {
    redirect("/admin/customers");
  }

  return (
    <section>
      <div className="admin-header">
        <div>
          <h2>{customer.name}</h2>
          <p className="muted">{customer.phone}</p>
        </div>
        <form action={deleteCustomer.bind(null, customer.id)}>
          <button className="button danger" type="submit">Borrar cliente</button>
        </form>
      </div>

      <div className="section" style={{ paddingTop: 0 }}>
        <h3>Ventas</h3>
        <div className="card" style={{ padding: 12 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>#</th>
                <th>Canal</th>
                <th>Total</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {customer.sales.map((sale) => (
                <tr key={sale.id}>
                  <td>{sale.createdAt.toLocaleDateString("es-AR")}</td>
                  <td>{sale.invoiceNumber || "-"}</td>
                  <td>{sale.channel}</td>
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
      </div>

      <div className="section">
        <h3>Reparaciones</h3>
        <div className="card" style={{ padding: 12 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Codigo</th>
                <th>Equipo</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {customer.repairs.map((repair) => (
                <tr key={repair.id}>
                  <td>{repair.trackingCode}</td>
                  <td>{repair.model}</td>
                  <td>
                    {REPAIR_STATUS_LABELS[repair.status as keyof typeof REPAIR_STATUS_LABELS]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
