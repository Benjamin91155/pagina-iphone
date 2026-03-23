import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slug";

async function updateProduct(productId: string, formData: FormData) {
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
    redirect(`/admin/products/${productId}/edit?error=1`);
  }

  const slug = slugify(`${name}-${capacity}-${condition}`);

  const existing = await prisma.product.findUnique({
    where: { id: productId },
    select: { stock: true }
  });

  await prisma.product.update({
    where: { id: productId },
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
        deleteMany: {},
        create: imageUrls.map((url, index) => ({
          url,
          alt: name,
          sortOrder: index
        }))
      }
    }
  });

  if (existing && existing.stock !== stock) {
    const diff = stock - existing.stock;
    await prisma.stockMovement.create({
      data: {
        productId,
        type: diff >= 0 ? "IN" : "OUT",
        quantity: Math.abs(diff),
        reason: "Ajuste manual"
      }
    });
  }

  redirect("/admin/products");
}

type PageProps = { params: { id: string }; searchParams?: { error?: string } };

export default async function EditProductPage({ params, searchParams }: PageProps) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { images: true }
  });

  if (!product) {
    redirect("/admin/products");
  }

  const imageUrls = product.images.map((img) => img.url).join("\n");
  const error = searchParams?.error;

  return (
    <section>
      <div className="admin-header">
        <div>
          <h2>Editar producto</h2>
          <p className="muted">Actualiza datos y stock.</p>
        </div>
      </div>

      <form className="form-card" action={updateProduct.bind(null, product.id)}>
        <div className="form-grid">
          <label>
            Nombre
            <input name="name" defaultValue={product.name} required />
          </label>
          <label>
            Modelo
            <input name="model" defaultValue={product.model} required />
          </label>
          <label>
            Capacidad
            <input name="capacity" defaultValue={product.capacity || ""} />
          </label>
          <label>
            Condicion
            <select name="condition" defaultValue={product.condition}>
              <option value="nuevo">Nuevo</option>
              <option value="usado">Usado</option>
            </select>
          </label>
          <label>
            Bateria (solo usados)
            <input name="batteryHealth" type="number" min="0" max="100" defaultValue={product.batteryHealth || ""} />
          </label>
          <label>
            Precio USD
            <input name="priceUsd" type="number" min="0" step="0.01" defaultValue={product.priceUsd} required />
          </label>
          <label>
            Stock
            <input name="stock" type="number" min="0" step="1" defaultValue={product.stock} />
          </label>
          <label>
            Stock minimo
            <input name="minStock" type="number" min="0" step="1" defaultValue={product.minStock || 0} />
          </label>
          <label>
            Categoria
            <select name="category" defaultValue={product.category}>
              <option value="iphone">iPhone</option>
              <option value="accesorio">Accesorio</option>
              <option value="otro">Otro</option>
            </select>
          </label>
        </div>
        <label>
          Descripcion
          <textarea name="description" defaultValue={product.description || ""} />
        </label>
        <label>
          Imagenes (una URL por linea)
          <textarea name="imageUrls" defaultValue={imageUrls} />
        </label>
        {error ? <p className="muted">Completa los campos obligatorios.</p> : null}
        <button className="button" type="submit">Guardar cambios</button>
      </form>
    </section>
  );
}
