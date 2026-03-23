import { prisma } from "@/lib/db";
import { formatArs } from "@/lib/format";
import { getSettings } from "@/lib/settings";

type MonthBucket = { label: string; total: number };

function buildLastMonths(count: number) {
  const now = new Date();
  const months: MonthBucket[] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = date.toLocaleDateString("es-AR", { month: "short", year: "2-digit" });
    months.push({ label, total: 0 });
  }
  return months;
}

export default async function AdminDashboard() {
  const [counts, settings, sales, saleItems, repairs] = await Promise.all([
    Promise.all([
      prisma.product.count(),
      prisma.repairOrder.count(),
      prisma.sale.count(),
      prisma.customer.count()
    ]),
    getSettings(),
    prisma.sale.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.saleItem.findMany({ include: { product: true } }),
    prisma.repairOrder.findMany({ select: { status: true } })
  ]);

  const [products, repairsCount, salesCount, customers] = counts;
  const totalRevenue = sales.reduce((acc, sale) => acc + sale.totalArs, 0);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentRevenue = sales
    .filter((sale) => sale.createdAt >= thirtyDaysAgo)
    .reduce((acc, sale) => acc + sale.totalArs, 0);

  const monthlyBuckets = buildLastMonths(6);
  const monthMap = new Map<string, MonthBucket>();
  monthlyBuckets.forEach((bucket) => {
    const key = bucket.label;
    monthMap.set(key, bucket);
  });

  sales.forEach((sale) => {
    const label = sale.createdAt.toLocaleDateString("es-AR", { month: "short", year: "2-digit" });
    const bucket = monthMap.get(label);
    if (bucket) bucket.total += sale.totalArs;
  });

  const marginPercent = settings.profitMarginPercent || 0;
  const estimatedMargin = saleItems.reduce((acc, item) => {
    if (!marginPercent) return acc;
    const base = item.priceArs / (1 + marginPercent / 100);
    return acc + (item.priceArs - base) * item.quantity;
  }, 0);

  const topProductsMap = new Map<string, { name: string; qty: number; revenue: number }>();
  saleItems.forEach((item) => {
    const key = item.productId;
    const current = topProductsMap.get(key) || {
      name: item.product?.name || "Producto",
      qty: 0,
      revenue: 0
    };
    current.qty += item.quantity;
    current.revenue += item.priceArs * item.quantity;
    topProductsMap.set(key, current);
  });
  const topProducts = Array.from(topProductsMap.values()).sort((a, b) => b.qty - a.qty).slice(0, 5);

  const repairByStatus = repairs.reduce<Record<string, number>>((acc, repair) => {
    acc[repair.status] = (acc[repair.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <section>
      <div className="admin-header">
        <div>
          <h2>Resumen general</h2>
          <p className="muted">Indicadores y rendimiento del negocio.</p>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <span>Productos</span>
          <strong>{products}</strong>
        </div>
        <div className="kpi">
          <span>Reparaciones</span>
          <strong>{repairsCount}</strong>
        </div>
        <div className="kpi">
          <span>Ventas</span>
          <strong>{salesCount}</strong>
        </div>
        <div className="kpi">
          <span>Clientes</span>
          <strong>{customers}</strong>
        </div>
        <div className="kpi">
          <span>Facturacion total</span>
          <strong>{formatArs(totalRevenue)}</strong>
        </div>
        <div className="kpi">
          <span>Ultimos 30 dias</span>
          <strong>{formatArs(recentRevenue)}</strong>
        </div>
        <div className="kpi">
          <span>Margen estimado</span>
          <strong>{formatArs(estimatedMargin)}</strong>
        </div>
      </div>

      <div className="section" style={{ paddingTop: 24 }}>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
          <div className="card" style={{ padding: 18 }}>
            <h3>Ventas por mes</h3>
            <ul className="metric-list">
              {monthlyBuckets.map((bucket) => (
                <li key={bucket.label}>
                  <span>{bucket.label}</span>
                  <strong>{formatArs(bucket.total)}</strong>
                </li>
              ))}
            </ul>
          </div>
          <div className="card" style={{ padding: 18 }}>
            <h3>Top productos</h3>
            <ul className="metric-list">
              {topProducts.map((product) => (
                <li key={product.name}>
                  <span>{product.name}</span>
                  <strong>
                    {product.qty}u · {formatArs(product.revenue)}
                  </strong>
                </li>
              ))}
              {topProducts.length === 0 ? <li className="muted">Sin ventas registradas.</li> : null}
            </ul>
          </div>
          <div className="card" style={{ padding: 18 }}>
            <h3>Reparaciones por estado</h3>
            <ul className="metric-list">
              {Object.entries(repairByStatus).map(([status, count]) => (
                <li key={status}>
                  <span>{status}</span>
                  <strong>{count}</strong>
                </li>
              ))}
              {Object.keys(repairByStatus).length === 0 ? <li className="muted">Sin reparaciones.</li> : null}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
