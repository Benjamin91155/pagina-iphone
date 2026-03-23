import { prisma } from "@/lib/db";
import { getExchangeRate, getSettings } from "@/lib/settings";
import { formatArs, formatUsd } from "@/lib/format";
import { usdToArs } from "@/lib/pricing";
import { ProductCard } from "@/components/ProductCard";

type PageProps = {
  searchParams?: {
    q?: string;
    model?: string;
    capacity?: string;
    condition?: string;
    category?: string;
    minBattery?: string;
    stock?: string;
    sort?: string;
  };
};

export default async function StorePage({ searchParams }: PageProps) {
  const settings = await getSettings();
  const [exchangeRate, allProducts] = await Promise.all([
    getExchangeRate(settings),
    prisma.product.findMany({
      include: { images: true },
      orderBy: { createdAt: "desc" }
    })
  ]);

  const queryValue = String(searchParams?.q || "").trim();
  const query = queryValue.toLowerCase();
  const model = String(searchParams?.model || "").trim();
  const capacity = String(searchParams?.capacity || "").trim();
  const condition = String(searchParams?.condition || "").trim();
  const category = String(searchParams?.category || "").trim();
  const minBattery = Number(searchParams?.minBattery || 0);
  const showAllStock = String(searchParams?.stock || "") === "all";
  const sort = String(searchParams?.sort || "new");

  let products = allProducts.filter((product) => (showAllStock ? true : product.stock > 0));

  if (query) {
    products = products.filter((product) => {
      const haystack = `${product.name} ${product.model} ${product.capacity || ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }

  if (model && model !== "all") {
    products = products.filter((product) => product.model === model);
  }

  if (capacity && capacity !== "all") {
    products = products.filter((product) => product.capacity === capacity);
  }

  if (condition && condition !== "all") {
    if (condition === "nuevo") {
      products = products.filter((product) => !product.isUsed);
    } else if (condition === "usado") {
      products = products.filter((product) => product.isUsed);
    }
  }

  if (category && category !== "all") {
    products = products.filter((product) => product.category === category);
  }

  if (minBattery) {
    products = products.filter((product) => (product.batteryHealth || 0) >= minBattery);
  }

  if (sort === "price-asc") {
    products = [...products].sort((a, b) => a.priceUsd - b.priceUsd);
  } else if (sort === "price-desc") {
    products = [...products].sort((a, b) => b.priceUsd - a.priceUsd);
  }

  const models = Array.from(new Set(allProducts.map((product) => product.model))).sort();
  const capacities = Array.from(
    new Set(allProducts.map((product) => product.capacity).filter(Boolean))
  ).sort();

  return (
    <>
      <section className="hero container">
        <div>
          <h1>Venta y servicio premium para tu proximo iPhone.</h1>
          <p>
            Equipos seleccionados, stock actualizado y seguimiento real de reparaciones.
            Todo en un solo sistema pensado para ventas online y gestion interna.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a className="button" href="#productos">Ver productos</a>
            <a className="button secondary" href="/reparaciones">Ingresar reparacion</a>
          </div>
        </div>
        <div className="hero-card">
          <ul>
            <li>Precios en USD con conversion a ARS</li>
            <li>Stock real y control de equipos</li>
            <li>Estado de bateria visible en usados</li>
            <li>Seguimiento por codigo para clientes</li>
          </ul>
        </div>
      </section>

      <section className="section container" id="productos">
        <div className="admin-header" style={{ alignItems: "flex-end" }}>
          <div>
            <h2>Stock disponible</h2>
            <p className="muted">{products.length} resultados</p>
          </div>
        </div>

        <form className="filters" method="get">
          <input name="q" placeholder="Buscar modelo o capacidad" defaultValue={queryValue} />
          <select name="model" defaultValue={model || "all"}>
            <option value="all">Modelo (todos)</option>
            {models.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select name="capacity" defaultValue={capacity || "all"}>
            <option value="all">Capacidad (todas)</option>
            {capacities.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select name="condition" defaultValue={condition || "all"}>
            <option value="all">Estado (todos)</option>
            <option value="nuevo">Nuevo</option>
            <option value="usado">Usado</option>
          </select>
          <select name="category" defaultValue={category || "all"}>
            <option value="all">Categoria</option>
            <option value="iphone">iPhone</option>
            <option value="accesorio">Accesorio</option>
            <option value="otro">Otro</option>
          </select>
          <input
            name="minBattery"
            type="number"
            min="0"
            max="100"
            placeholder="Bateria min"
            defaultValue={minBattery ? String(minBattery) : ""}
          />
          <select name="sort" defaultValue={sort}>
            <option value="new">Orden: nuevos</option>
            <option value="price-asc">Precio: menor</option>
            <option value="price-desc">Precio: mayor</option>
          </select>
          <label className="checkbox">
            <input type="checkbox" name="stock" value="all" defaultChecked={showAllStock} />
            Mostrar sin stock
          </label>
          <div className="filter-actions">
            <button className="button" type="submit">Filtrar</button>
            <a className="button secondary" href="/">Limpiar</a>
          </div>
        </form>

        <div className="grid">
          {products.map((product) => {
            const ars = usdToArs(product.priceUsd, exchangeRate, settings.profitMarginPercent);
            const prices = {
              ars: formatArs(ars),
              usd: formatUsd(product.priceUsd)
            };
            return <ProductCard key={product.id} product={product} prices={prices} />;
          })}
        </div>
        {products.length === 0 ? <p className="muted">No hay productos con esos filtros.</p> : null}
      </section>
    </>
  );
}

