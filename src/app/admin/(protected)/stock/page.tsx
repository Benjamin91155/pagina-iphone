import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function StockPage() {
  const products = await prisma.product.findMany({
    orderBy: { stock: "asc" },
    include: { lots: true }
  });

  const lowStock = products.filter((product) => product.stock <= product.minStock);

  return (
    <section>
      <div className="admin-header">
        <div>
          <h2>Stock</h2>
          <p className="muted">Alertas, lotes y movimientos.</p>
        </div>
      </div>

      {lowStock.length > 0 ? (
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <h3>Alertas de bajo stock</h3>
          <div className="pill-row">
            {lowStock.map((product) => (
              <span key={product.id} className="pill warning">
                {product.name} ({product.stock})
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="card" style={{ padding: 12 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Stock</th>
              <th>Min</th>
              <th>Lotes</th>
              <th>Condicion</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>
                  {product.stock}
                  {product.stock <= product.minStock ? <span className="pill warning">Bajo</span> : null}
                </td>
                <td>{product.minStock}</td>
                <td>{product.lots.length}</td>
                <td>{product.condition}</td>
                <td>
                  <Link className="button secondary" href={`/admin/stock/${product.id}`}>
                    Gestionar
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

