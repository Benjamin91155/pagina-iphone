import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createAdminSession } from "@/lib/auth";
import { validateAdminCredentialsServer } from "@/lib/auth-db";

type PageProps = { searchParams?: { error?: string } };

async function loginAction(formData: FormData) {
  "use server";

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "").trim();

  const valid = await validateAdminCredentialsServer(email, password);
  if (!valid) {
    redirect("/admin/login?error=1");
  }

  const token = await createAdminSession(email);
  cookies().set("admin_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
  });

  redirect("/admin");
}

export default function AdminLoginPage({ searchParams }: PageProps) {
  const error = searchParams?.error;

  return (
    <section>
      <div className="admin-header">
        <div>
          <h2>Acceso Admin</h2>
          <p className="muted">Ingresar con usuario y clave.</p>
        </div>
      </div>

      <form className="form-card" action={loginAction}>
        <div className="form-grid">
          <label>
            Email
            <input name="email" type="email" placeholder="admin@local" required />
          </label>
          <label>
            Contrasena
            <input name="password" type="password" required />
          </label>
        </div>
        {error ? <p className="muted">Credenciales incorrectas.</p> : null}
        <button className="button" type="submit">Entrar</button>
      </form>
    </section>
  );
}
