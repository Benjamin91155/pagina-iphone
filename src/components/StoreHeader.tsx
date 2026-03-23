import Link from "next/link";

export function StoreHeader({ shopName }: { shopName: string }) {
  return (
    <header className="store-header">
      <div className="container header-inner">
        <Link href="/" className="brand">
          <span className="brand-dot" />
          <span>{shopName}</span>
        </Link>
        <nav className="nav-links">
          <Link href="/">Tienda</Link>
          <Link href="/reparaciones">Reparaciones</Link>
          <Link href="/seguimiento">Seguimiento</Link>
          <Link href="/mi-cuenta">Mi cuenta</Link>
          <Link href="/admin">Admin</Link>
        </nav>
      </div>
    </header>
  );
}

