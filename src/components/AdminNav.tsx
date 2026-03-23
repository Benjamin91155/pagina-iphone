import Link from "next/link";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Productos" },
  { href: "/admin/stock", label: "Stock" },
  { href: "/admin/repairs", label: "Reparaciones" },
  { href: "/admin/customers", label: "Clientes" },
  { href: "/admin/sales", label: "Ventas" },
  { href: "/admin/settings", label: "Precios" },
  { href: "/admin/security", label: "Seguridad" }
];

export function AdminNav() {
  return (
    <aside className="admin-nav">
      <div className="admin-brand">
        <span className="brand-dot" />
        <span>Panel</span>
      </div>
      <Link className="button secondary" href="/">
        Volver a tienda
      </Link>
      <Link className="button danger" href="/admin/logout">
        Cerrar sesion
      </Link>
      <nav>
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

