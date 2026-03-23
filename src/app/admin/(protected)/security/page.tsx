import { redirect } from "next/navigation";
import {
  getAdminEmailFallback,
  getAdminUser,
  upsertAdminCredentials,
  verifyAdminPassword
} from "@/lib/auth-db";

type PageProps = { searchParams?: { error?: string; success?: string } };

async function updateCredentials(formData: FormData) {
  "use server";

  const email = String(formData.get("email") || "").trim();
  const currentPassword = String(formData.get("currentPassword") || "").trim();
  const newPassword = String(formData.get("password") || "").trim();
  const confirmPassword = String(formData.get("confirmPassword") || "").trim();

  if (!email || !currentPassword) {
    redirect("/admin/security?error=required");
  }

  const isFirstSetup = !(await getAdminUser());

  const currentOk = await verifyAdminPassword(currentPassword);
  if (!currentOk) {
    redirect("/admin/security?error=current");
  }

  if (newPassword && newPassword !== confirmPassword) {
    redirect("/admin/security?error=confirm");
  }

  if (isFirstSetup && !newPassword) {
    redirect("/admin/security?error=required");
  }

  try {
    await upsertAdminCredentials(email, newPassword || undefined);
    redirect("/admin/security?success=1");
  } catch {
    redirect("/admin/security?error=save");
  }
}

export default async function AdminSecurityPage({ searchParams }: PageProps) {
  const adminUser = await getAdminUser();
  const isFirstSetup = !adminUser;
  const email = await getAdminEmailFallback();
  const error = searchParams?.error;
  const success = searchParams?.success;

  return (
    <section>
      <div className="admin-header">
        <div>
          <h2>Seguridad</h2>
          <p className="muted">Actualizar email y contrasena de admin.</p>
        </div>
      </div>

      <form className="form-card" action={updateCredentials}>
        <div className="form-grid">
          <label>
            Email
            <input name="email" type="email" defaultValue={email} required />
          </label>
          <label>
            Contrasena actual
            <input name="currentPassword" type="password" required />
          </label>
          <label>
            Nueva contrasena
            <input
              name="password"
              type="password"
              placeholder={isFirstSetup ? "Obligatoria en el primer setup" : "Dejar vacio para mantener"}
              required={isFirstSetup}
            />
          </label>
          <label>
            Confirmar nueva contrasena
            <input
              name="confirmPassword"
              type="password"
              placeholder={isFirstSetup ? "Repite la contrasena" : "Solo si vas a cambiarla"}
              required={isFirstSetup}
            />
          </label>
        </div>
        {error === "required" ? <p className="muted">Completa email y contrasena actual.</p> : null}
        {error === "current" ? <p className="muted">Contrasena actual incorrecta.</p> : null}
        {error === "confirm" ? <p className="muted">La nueva contrasena no coincide.</p> : null}
        {error === "save" ? <p className="muted">No se pudo guardar. Intenta de nuevo.</p> : null}
        {success ? <p className="muted">Credenciales actualizadas.</p> : null}
        <button className="button" type="submit">Guardar cambios</button>
      </form>

      <div className="info-panel" style={{ marginTop: 16 }}>
        <p>
          El token de sesion usa el secreto configurado en <code>.env</code>. Si queres rotarlo,
          cambia <code>ADMIN_SECRET</code> y reinicia el servidor.
        </p>
      </div>
    </section>
  );
}
