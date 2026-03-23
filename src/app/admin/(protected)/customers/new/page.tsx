import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

async function createCustomer(formData: FormData) {
  "use server";

  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!name || !phone) {
    redirect("/admin/customers/new?error=1");
  }

  await prisma.customer.create({
    data: {
      name,
      phone,
      email: email || null,
      notes: notes || null
    }
  });

  redirect("/admin/customers");
}

type PageProps = { searchParams?: { error?: string } };

export default function NewCustomerPage({ searchParams }: PageProps) {
  const error = searchParams?.error;

  return (
    <section>
      <div className="admin-header">
        <div>
          <h2>Nuevo cliente</h2>
          <p className="muted">Carga manual para ventas locales.</p>
        </div>
      </div>

      <form className="form-card" action={createCustomer}>
        <div className="form-grid">
          <label>
            Nombre
            <input name="name" required />
          </label>
          <label>
            Telefono
            <input name="phone" required />
          </label>
          <label>
            Email
            <input name="email" type="email" />
          </label>
        </div>
        <label>
          Notas
          <textarea name="notes" />
        </label>
        {error ? <p className="muted">Completa nombre y telefono.</p> : null}
        <button className="button" type="submit">Guardar cliente</button>
      </form>
    </section>
  );
}

