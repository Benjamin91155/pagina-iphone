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

async function createRepair(formData: FormData) {
  "use server";

  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const model = String(formData.get("model") || "").trim();
  const issue = String(formData.get("issue") || "").trim();
  const shippingMethod = String(formData.get("shippingMethod") || "RETIRO");

  if (!name || !phone || !model || !issue) {
    redirect("/admin/repairs/new?error=1");
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
      intakeChannel: "LOCAL",
      customerId: customer.id,
      status: "INGRESADO"
    }
  });

  await prisma.repairUpdate.create({
    data: {
      repairOrderId: order.id,
      status: "INGRESADO",
      note: "Ingreso local"
    }
  });

  redirect(`/admin/repairs/${order.id}`);
}

type PageProps = { searchParams?: { error?: string } };

export default function NewRepairPage({ searchParams }: PageProps) {
  const error = searchParams?.error;

  return (
    <section>
      <div className="admin-header">
        <div>
          <h2>Nueva reparacion</h2>
          <p className="muted">Carga interna para seguimiento y costos.</p>
        </div>
      </div>

      <form className="form-card" action={createRepair}>
        <div className="form-grid">
          <label>
            Cliente
            <input name="name" required />
          </label>
          <label>
            Telefono
            <input name="phone" required />
          </label>
          <label>
            Modelo
            <input name="model" required />
          </label>
          <label>
            Envio
            <select name="shippingMethod" defaultValue="RETIRO">
              <option value="RETIRO">Retiro en persona</option>
              <option value="ENVIO">Envio</option>
            </select>
          </label>
        </div>
        <label>
          Problema
          <textarea name="issue" required />
        </label>
        {error ? <p className="muted">Completa los datos.</p> : null}
        <button className="button" type="submit">Crear orden</button>
      </form>
    </section>
  );
}

