import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { getCustomerFromSession } from "@/lib/customer-auth";
import { REPAIR_STATUS_LABELS } from "@/lib/repair";

export default async function CustomerRepairsPage() {
  const token = cookies().get("customer_session")?.value;
  const customer = await getCustomerFromSession(token);

  if (!customer) return null;

  const repairs = await prisma.repairOrder.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" }
  });

  return (
    <section className="section container">
      <h2>Mis reparaciones</h2>
      <div className="card" style={{ padding: 12 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Codigo</th>
              <th>Equipo</th>
              <th>Estado</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {repairs.map((repair) => (
              <tr key={repair.id}>
                <td>{repair.trackingCode}</td>
                <td>{repair.model}</td>
                <td>
                  {REPAIR_STATUS_LABELS[repair.status as keyof typeof REPAIR_STATUS_LABELS] || repair.status}
                </td>
                <td>{repair.createdAt.toLocaleDateString("es-AR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {repairs.length === 0 ? <p className="muted">Aun no tienes reparaciones.</p> : null}
      </div>
    </section>
  );
}
