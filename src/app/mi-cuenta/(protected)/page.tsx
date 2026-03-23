import Link from "next/link";
import { cookies } from "next/headers";
import { getCustomerFromSession } from "@/lib/customer-auth";

export default async function CustomerDashboard() {
  const token = cookies().get("customer_session")?.value;
  const customer = await getCustomerFromSession(token);

  if (!customer) return null;

  return (
    <section className="section container">
      <div className="admin-header">
        <div>
          <h2>Hola, {customer.name}</h2>
          <p className="muted">{customer.phone} {customer.email ? `- ${customer.email}` : ""}</p>
        </div>
      </div>

      <div className="grid">
        <div className="card" style={{ padding: 20 }}>
          <h3>Mis reparaciones</h3>
          <p className="muted">Consulta el estado de tus equipos.</p>
          <Link className="button" href="/mi-cuenta/reparaciones">Ver reparaciones</Link>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <h3>Mis compras</h3>
          <p className="muted">Historial de compras y pagos.</p>
          <Link className="button secondary" href="/mi-cuenta/compras">Ver compras</Link>
        </div>
      </div>
    </section>
  );
}
