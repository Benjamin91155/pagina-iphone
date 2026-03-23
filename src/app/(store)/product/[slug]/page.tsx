import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getExchangeRate, getSettings } from "@/lib/settings";
import { formatArs, formatUsd } from "@/lib/format";
import { applyInstallments, usdToArs } from "@/lib/pricing";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductCard } from "@/components/ProductCard";

type PageProps = { params: { slug: string } };

export default async function ProductDetailPage({ params }: PageProps) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: {
      images: true,
      movements: { orderBy: { createdAt: "desc" }, take: 6 }
    }
  });

  if (!product) notFound();

  const settings = await getSettings();
  const exchangeRate = await getExchangeRate(settings);
  const cash = usdToArs(product.priceUsd, exchangeRate, settings.profitMarginPercent);
  const installmentsTotal = applyInstallments(cash, settings.installmentsFeePercent);
  const installmentsCount = Math.max(1, settings.installmentsCount);
  const perInstallment = installmentsTotal / installmentsCount;

  const waMessage = `Hola! Me interesa el ${product.name} (${product.capacity || ""}).`;

  const related = await prisma.product.findMany({
    where: {
      id: { not: product.id },
      OR: [{ model: product.model }, { category: product.category }]
    },
    include: { images: true },
    take: 3
  });

  return (
    <section className="section container">
      <div className="card" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        <div style={{ padding: 24 }}>
          <ProductGallery
            images={product.images.length ? product.images : [{ url: "/sample/iphone-13-pro.svg" }]}
            fallbackAlt={product.name}
          />
        </div>
        <div className="product-body" style={{ padding: 28 }}>
          <h2>{product.name}</h2>
          <p className="muted">
            {product.model} {product.capacity ? `- ${product.capacity}` : ""}
          </p>
          <div className="info-panel">
            <p>Condicion: {product.condition}</p>
            {product.isUsed ? <p>Bateria: {product.batteryHealth || "N/A"}%</p> : <p>Equipo nuevo</p>}
            <p>Stock: {product.stock}</p>
            <p>Categoria: {product.category}</p>
          </div>
          <div className="price-block">
            <span>Precio efectivo: {formatArs(cash)}</span>
            <small>USD base: {formatUsd(product.priceUsd)}</small>
            <small>
              Precio en cuotas: {installmentsCount} x {formatArs(perInstallment)}
            </small>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a className="button" href={`/checkout?product=${product.slug}`}>Comprar online</a>
            <a
              className="button secondary"
              href={`https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(waMessage)}`}
              target="_blank"
              rel="noreferrer"
            >
              Consultar por WhatsApp
            </a>
          </div>
        </div>
      </div>

      <div className="section" style={{ paddingBottom: 0 }}>
        <h3>Descripcion</h3>
        <p className="muted">{product.description || "Sin descripcion adicional."}</p>
      </div>

      <div className="section">
        <h3>Historial de stock</h3>
        <div className="card" style={{ padding: 16 }}>
          <ul className="timeline">
            {product.movements.map((movement) => (
              <li key={movement.id}>
                <strong>{movement.type}</strong>
                <span>
                  {movement.quantity}u · {movement.createdAt.toLocaleDateString("es-AR")}
                </span>
              </li>
            ))}
          </ul>
          {product.movements.length === 0 ? <p className="muted">Sin movimientos registrados.</p> : null}
        </div>
      </div>

      {related.length > 0 ? (
        <div className="section">
          <h3>Productos relacionados</h3>
          <div className="grid">
            {related.map((item) => {
              const ars = usdToArs(item.priceUsd, exchangeRate, settings.profitMarginPercent);
              return (
                <ProductCard
                  key={item.id}
                  product={item}
                  prices={{ ars: formatArs(ars), usd: formatUsd(item.priceUsd) }}
                />
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
