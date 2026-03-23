import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  createCustomerSession,
  createCustomerUser,
  getOrCreateCustomerByPhone,
  normalizePhone,
  requestOtp,
  validateEmailPassword,
  verifyOtp
} from "@/lib/customer-auth";

type PageProps = {
  searchParams?: {
    error?: string;
    step?: string;
    phone?: string;
    devcode?: string;
    success?: string;
  };
};

async function loginWithEmail(formData: FormData) {
  "use server";

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "").trim();

  if (!email || !password) {
    redirect("/mi-cuenta/login?error=email");
  }

  const customerId = await validateEmailPassword(email, password);
  if (!customerId) {
    redirect("/mi-cuenta/login?error=email");
  }

  const session = await createCustomerSession(customerId);
  cookies().set("customer_session", session.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });

  redirect("/mi-cuenta");
}

async function registerWithEmail(formData: FormData) {
  "use server";

  const name = String(formData.get("name") || "").trim();
  const phoneRaw = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "").trim();
  const confirm = String(formData.get("confirm") || "").trim();

  if (!name || !phoneRaw || !email || !password) {
    redirect("/mi-cuenta/login?error=register");
  }

  if (password !== confirm) {
    redirect("/mi-cuenta/login?error=confirm");
  }

  const phone = normalizePhone(phoneRaw);

  try {
    const customerId = await createCustomerUser({ name, phone, email, password });
    const session = await createCustomerSession(customerId);
    cookies().set("customer_session", session.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });
    redirect("/mi-cuenta");
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "EMAIL_EXISTS") {
      redirect("/mi-cuenta/login?error=exists");
    }
    redirect("/mi-cuenta/login?error=register");
  }
}

async function requestOtpAction(formData: FormData) {
  "use server";

  const phoneRaw = String(formData.get("phone") || "").trim();
  if (!phoneRaw) {
    redirect("/mi-cuenta/login?error=otp");
  }

  const phone = normalizePhone(phoneRaw);
  const code = await requestOtp(phone);
  const params = new URLSearchParams({
    step: "verify",
    phone,
    success: "sent"
  });

  if (process.env.NODE_ENV !== "production") {
    params.set("devcode", code);
  }

  redirect(`/mi-cuenta/login?${params.toString()}`);
}

async function verifyOtpAction(formData: FormData) {
  "use server";

  const phone = normalizePhone(String(formData.get("phone") || "").trim());
  const code = String(formData.get("code") || "").trim();

  if (!phone || !code) {
    redirect(`/mi-cuenta/login?step=verify&phone=${encodeURIComponent(phone)}&error=otpcode`);
  }

  const valid = await verifyOtp(phone, code);
  if (!valid) {
    redirect(`/mi-cuenta/login?step=verify&phone=${encodeURIComponent(phone)}&error=otpcode`);
  }

  const customerId = await getOrCreateCustomerByPhone(phone);
  const session = await createCustomerSession(customerId);
  cookies().set("customer_session", session.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });

  redirect("/mi-cuenta");
}

export default function CustomerLoginPage({ searchParams }: PageProps) {
  const error = searchParams?.error;
  const step = searchParams?.step;
  const phone = searchParams?.phone || "";
  const success = searchParams?.success;
  const devcode = searchParams?.devcode;

  return (
    <section className="section container">
      <div className="admin-header">
        <div>
          <h2>Mi cuenta</h2>
          <p className="muted">Accede para ver tus compras y reparaciones.</p>
        </div>
      </div>

      <div className="grid">
        <form className="form-card" action={loginWithEmail}>
          <h3>Ingresar con email</h3>
          <label>
            Email
            <input name="email" type="email" required />
          </label>
          <label>
            Contrasena
            <input name="password" type="password" required />
          </label>
          {error === "email" ? <p className="muted">Email o contrasena incorrectos.</p> : null}
          <button className="button" type="submit">Ingresar</button>
        </form>

        <form className="form-card" action={registerWithEmail}>
          <h3>Crear cuenta</h3>
          <label>
            Nombre
            <input name="name" required />
          </label>
          <label>
            Telefono
            <input name="phone" placeholder="11 0000 0000" required />
          </label>
          <label>
            Email
            <input name="email" type="email" required />
          </label>
          <label>
            Contrasena
            <input name="password" type="password" required />
          </label>
          <label>
            Confirmar contrasena
            <input name="confirm" type="password" required />
          </label>
          {error === "register" ? <p className="muted">Completa todos los datos.</p> : null}
          {error === "confirm" ? <p className="muted">Las contrasenas no coinciden.</p> : null}
          {error === "exists" ? <p className="muted">Ese email ya esta registrado.</p> : null}
          <button className="button" type="submit">Crear cuenta</button>
        </form>

        <form className="form-card" action={requestOtpAction}>
          <h3>Ingresar con codigo</h3>
          <label>
            Telefono
            <input name="phone" placeholder="11 0000 0000" required />
          </label>
          {error === "otp" ? <p className="muted">Ingresa un telefono valido.</p> : null}
          <button className="button" type="submit">Enviar codigo</button>
          <p className="muted">Te enviamos un codigo por WhatsApp/SMS.</p>
        </form>
      </div>

      {step === "verify" ? (
        <div className="section" style={{ paddingTop: 10 }}>
          <form className="form-card" action={verifyOtpAction}>
            <h3>Verificar codigo</h3>
            <input type="hidden" name="phone" value={phone} />
            <label>
              Codigo recibido
              <input name="code" placeholder="123456" required />
            </label>
            {success === "sent" ? <p className="muted">Codigo enviado a {phone}.</p> : null}
            {error === "otpcode" ? <p className="muted">Codigo invalido o vencido.</p> : null}
            {devcode ? (
              <p className="muted">Modo desarrollo: codigo {devcode}</p>
            ) : null}
            <button className="button" type="submit">Validar</button>
          </form>
        </div>
      ) : null}
    </section>
  );
}
