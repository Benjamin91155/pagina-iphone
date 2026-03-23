import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <section>
      <div className="admin-header">
        <div>
          <h2>Productos</h2>
          <p className="muted">Gestion de equipos y accesorios.</p>
        </div>
        <Link className="button" href="/admin/products/new">Nuevo producto</Link>
      </div>

      <div className="card" style={{ padding: 12 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Modelo</th>
              <th>Condicion</th>
              <th>Stock</th>
              <th>Min</th>
              <th>USD</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.model}</td>
                <td>{product.condition}</td>
                <td>
                  {product.stock}
                  {product.stock <= product.minStock ? <span className="pill warning">Bajo</span> : null}
                </td>
                <td>{product.minStock}</td>
                <td>{product.priceUsd}</td>
                <td>
                  <Link className="button secondary" href={`/admin/products/${product.id}/edit`}>
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

