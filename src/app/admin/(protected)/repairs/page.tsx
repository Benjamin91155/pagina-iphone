import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { REPAIR_STATUS_LABELS } from "@/lib/repair";

async function deleteRepair(repairId: string) {
  "use server";

  await prisma.$transaction(async (tx) => {
    await tx.repairUpdate.deleteMany({ where: { repairOrderId: repairId } });
    await tx.stockMovement.deleteMany({ where: { repairOrderId: repairId } });
    await tx.repairOrder.delete({ where: { id: repairId } });
  });

  redirect("/admin/repairs");
}

export default async function AdminRepairsPage() {
  const repairs = await prisma.repairOrder.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <section>
      <div className="admin-header">
        <div>
          <h2>Reparaciones</h2>
          <p className="muted">Ordenes y seguimiento.</p>
        </div>
        <Link className="button" href="/admin/repairs/new">Nueva orden</Link>
      </div>

      <div className="card" style={{ padding: 12 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Codigo</th>
              <th>Cliente</th>
              <th>Equipo</th>
              <th>Estado</th>
              <th>Presupuesto</th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {repairs.map((repair) => (
              <tr key={repair.id}>
                <td>{repair.trackingCode}</td>
                <td>{repair.customerName}</td>
                <td>{repair.model}</td>
                <td>
                  {REPAIR_STATUS_LABELS[repair.status as keyof typeof REPAIR_STATUS_LABELS]}
                </td>
                <td>{repair.quoteApproved ? "Aprobado" : "Pendiente"}</td>
                <td>
                  <Link className="button secondary" href={`/admin/repairs/${repair.id}`}>
                    Ver detalle
                  </Link>
                </td>
                <td>
                  <form action={deleteRepair.bind(null, repair.id)}>
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

