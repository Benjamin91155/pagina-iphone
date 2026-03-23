import type { ReactNode } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCustomerFromSession } from "@/lib/customer-auth";

export const metadata = {
  title: "Mi cuenta"
};

export default async function CustomerLayout({ children }: { children: ReactNode }) {
  const token = cookies().get("customer_session")?.value;
  const customer = await getCustomerFromSession(token);

  if (!customer) {
    redirect("/mi-cuenta/login");
  }

  return (
    <div>
      <header className="store-header">
        <div className="container header-inner">
          <Link href="/" className="brand">
            <span className="brand-dot" />
            <span>Mi cuenta</span>
          </Link>
          <nav className="nav-links">
            <Link href="/">Tienda</Link>
            <Link href="/mi-cuenta">Resumen</Link>
            <Link href="/mi-cuenta/reparaciones">Reparaciones</Link>
            <Link href="/mi-cuenta/compras">Compras</Link>
            <Link className="button danger" href="/mi-cuenta/logout">Salir</Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

export const dynamic = "force-dynamic";
