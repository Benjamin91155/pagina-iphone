import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slug";

async function createProduct(formData: FormData) {
  "use server";

  const name = String(formData.get("name") || "").trim();
  const model = String(formData.get("model") || "").trim();
  const capacity = String(formData.get("capacity") || "").trim();
  const condition = String(formData.get("condition") || "nuevo").trim();
  const priceUsd = Number(formData.get("priceUsd") || 0);
  const stock = Number(formData.get("stock") || 0);
  const minStock = Number(formData.get("minStock") || 0);
  const batteryHealth = Number(formData.get("batteryHealth") || 0);
  const description = String(formData.get("description") || "").trim();
  const category = String(formData.get("category") || "iphone").trim();
  const imageUrls = String(formData.get("imageUrls") || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!name || !model || !priceUsd) {
    redirect("/admin/products/new?error=1");
  }

  const slug = slugify(`${name}-${capacity}-${condition}`);

  const product = await prisma.product.create({
    data: {
      slug,
      name,
      model,
      capacity: capacity || null,
      condition,
      isUsed: condition === "usado",
      batteryHealth: condition === "usado" ? batteryHealth || null : null,
      category,
      priceUsd,
      stock,
      minStock,
      description: description || null,
      images: {
        create: imageUrls.map((url, index) => ({
          url,
          alt: name,
          sortOrder: index
        }))
      }
    }
  });

  if (stock > 0) {
    await prisma.stockMovement.create({
      data: {
        productId: product.id,
        type: "IN",
        quantity: stock,
        reason: "Stock inicial"
      }
    });
  }

  redirect("/admin/products");
}

type PageProps = { searchParams?: { error?: string } };

export default function NewProductPage({ searchParams }: PageProps) {
  const error = searchParams?.error;

  return (
    <section>
      <div className="admin-header">
        <div>
          <h2>Nuevo producto</h2>
          <p className="muted">Carga equipos nuevos, usados o accesorios.</p>
        </div>
      </div>

      <form className="form-card" action={createProduct}>
        <div className="form-grid">
          <label>
            Nombre
            <input name="name" placeholder="iPhone 13 Pro" required />
          </label>
          <label>
            Modelo
            <input name="model" placeholder="iPhone 13 Pro" required />
          </label>
          <label>
            Capacidad
            <input name="capacity" placeholder="128GB" />
          </label>
          <label>
            Condicion
            <select name="condition" defaultValue="nuevo">
              <option value="nuevo">Nuevo</option>
              <option value="usado">Usado</option>
            </select>
          </label>
          <label>
            Bateria (solo usados)
            <input name="batteryHealth" type="number" min="0" max="100" placeholder="85" />
          </label>
          <label>
            Precio USD
            <input name="priceUsd" type="number" min="0" step="0.01" required />
          </label>
          <label>
            Stock
            <input name="stock" type="number" min="0" step="1" defaultValue="1" />
          </label>
          <label>
            Stock minimo
            <input name="minStock" type="number" min="0" step="1" defaultValue="0" />
          </label>
          <label>
            Categoria
            <select name="category" defaultValue="iphone">
              <option value="iphone">iPhone</option>
              <option value="accesorio">Accesorio</option>
              <option value="otro">Otro</option>
            </select>
          </label>
        </div>
        <label>
          Descripcion
          <textarea name="description" placeholder="Detalles del equipo, garantia, accesorios incluidos." />
        </label>
        <label>
          Imagenes (una URL por linea)
          <textarea name="imageUrls" placeholder="/sample/iphone-13-pro.svg" />
        </label>
        {error ? <p className="muted">Completa los campos obligatorios.</p> : null}
        <button className="button" type="submit">Guardar producto</button>
      </form>
    </section>
  );
}

