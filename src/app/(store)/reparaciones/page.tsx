import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createTrackingCode } from "@/lib/repair";

async function generateUniqueTrackingCode() {
  for (let i = 0; i < 5; i += 1) {
    const code = createTrackingCode();
    const exists = await prisma.repairOrder.findUnique({ where: { trackingCode: code } });
    if (!exists) return code;
  }
  return createTrackingCode();
}

async function createRepairRequest(formData: FormData) {
  "use server";

  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const model = String(formData.get("model") || "").trim();
  const issue = String(formData.get("issue") || "").trim();
  const shippingMethod = String(formData.get("shippingMethod") || "RETIRO");

  if (!name || !phone || !model || !issue) {
    redirect("/reparaciones?error=1");
  }

  let customer = await prisma.customer.findFirst({ where: { phone } });
  if (!customer) {
    customer = await prisma.customer.create({ data: { name, phone } });
  }

  const trackingCode = await generateUniqueTrackingCode();

  const order = await prisma.repairOrder.create({
    data: {
      trackingCode,
      customerName: name,
      phone,
      model,
      issue,
      shippingMethod: shippingMethod === "ENVIO" ? "ENVIO" : "RETIRO",
      intakeChannel: "ONLINE",
      customerId: customer.id,
      status: "INGRESADO"
    }
  });

  await prisma.repairUpdate.create({
    data: {
      repairOrderId: order.id,
      status: "INGRESADO",
      note: "Ingreso web"
    }
  });

  redirect(`/seguimiento?code=${trackingCode}`);
}

type PageProps = { searchParams?: { error?: string } };

export default function RepairsPage({ searchParams }: PageProps) {
  const showError = searchParams?.error;

  return (
    <section className="section container">
      <div className="admin-header">
        <div>
          <h2>Solicitud de reparacion</h2>
          <p className="muted">Completa el formulario y te enviamos el codigo de seguimiento.</p>
        </div>
      </div>

      <form className="form-card" action={createRepairRequest}>
        <div className="form-grid">
          <label>
            Nombre
            <input name="name" placeholder="Nombre y apellido" required />
          </label>
          <label>
            Telefono
            <input name="phone" placeholder="11 0000 0000" required />
          </label>
          <label>
            Modelo
            <input name="model" placeholder="iPhone 12, 13 Pro, etc" required />
          </label>
          <label>
            Tipo de envio
            <select name="shippingMethod" defaultValue="RETIRO">
              <option value="RETIRO">Retiro en persona</option>
              <option value="ENVIO">Envio</option>
            </select>
          </label>
        </div>
        <label>
          Problema
          <textarea name="issue" placeholder="Describe el problema del equipo" required />
        </label>
        {showError ? <p className="muted">Faltan datos, revisa el formulario.</p> : null}
        <button className="button" type="submit">Crear orden</button>
      </form>
    </section>
  );
}

