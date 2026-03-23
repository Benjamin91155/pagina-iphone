import Link from "next/link";
import type { Product, ProductImage } from "@prisma/client";

type ProductWithImages = Product & { images: ProductImage[] };

export function ProductCard({
  product,
  prices
}: {
  product: ProductWithImages;
  prices: { ars: string; usd: string };
}) {
  const image = product.images?.[0]?.url || "/sample/iphone-13-pro.svg";

  return (
    <div className="card product-card">
      <div className="product-image">
        <img src={image} alt={product.name} />
        <span className="badge">{product.condition}</span>
        {product.stock === 0 ? (
          <span className="pill danger">Sin stock</span>
        ) : product.stock <= product.minStock ? (
          <span className="pill warning">Stock bajo</span>
        ) : null}
      </div>
      <div className="product-body">
        <h3>{product.name}</h3>
        <p className="muted">
          {product.model} {product.capacity ? `- ${product.capacity}` : ""}
        </p>
        {product.isUsed ? (
          <p className="muted">Bateria {product.batteryHealth || "N/A"}%</p>
        ) : (
          <p className="muted">Equipo nuevo</p>
        )}
        <div className="price-block">
          <span>{prices.ars}</span>
          <small>{prices.usd}</small>
        </div>
        <Link className="button" href={`/product/${product.slug}`}>
          Ver detalle
        </Link>
      </div>
    </div>
  );
}

