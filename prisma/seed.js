const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function slugify(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function main() {
  const settings = await prisma.setting.findFirst();
  if (!settings) {
    await prisma.setting.create({
      data: {
        exchangeRateMode: "manual",
        exchangeRate: 1100,
        profitMarginPercent: 12,
        installmentsFeePercent: 18,
        installmentsCount: 6,
        whatsappNumber: "5491122223333",
        shopName: "iPhone Lab"
      }
    });
  }

  const productsCount = await prisma.product.count();
  if (productsCount > 0) return;

  const products = [
    {
      name: "iPhone 13 Pro",
      model: "iPhone 13 Pro",
      capacity: "128GB",
      condition: "usado",
      isUsed: true,
      batteryHealth: 88,
      category: "iphone",
      priceUsd: 620,
      stock: 1,
      minStock: 1,
      description: "Equipo con detalle minimo en marco. Incluye caja y cable.",
      images: ["/sample/iphone-13-pro.svg"]
    },
    {
      name: "iPhone 12",
      model: "iPhone 12",
      capacity: "64GB",
      condition: "usado",
      isUsed: true,
      batteryHealth: 83,
      category: "iphone",
      priceUsd: 420,
      stock: 2,
      minStock: 1,
      description: "Pantalla impecable. Bateria al 83%.",
      images: ["/sample/iphone-12.svg"]
    },
    {
      name: "iPhone 15",
      model: "iPhone 15",
      capacity: "128GB",
      condition: "nuevo",
      isUsed: false,
      batteryHealth: null,
      category: "iphone",
      priceUsd: 920,
      stock: 3,
      minStock: 1,
      description: "Sellado de fabrica. Garantia oficial.",
      images: ["/sample/iphone-15.svg"]
    },
    {
      name: "Parlante Bluetooth X200",
      model: "X200",
      capacity: null,
      condition: "nuevo",
      isUsed: false,
      batteryHealth: null,
      category: "accesorio",
      priceUsd: 65,
      stock: 10,
      minStock: 3,
      description: "Parlante portatil con 12 horas de autonomia.",
      images: ["/sample/speaker.svg"]
    }
  ];

  for (const product of products) {
    const created = await prisma.product.create({
      data: {
        slug: slugify(`${product.name}-${product.capacity || ""}-${product.condition}`),
        name: product.name,
        model: product.model,
        capacity: product.capacity,
        condition: product.condition,
        isUsed: product.isUsed,
        batteryHealth: product.batteryHealth || undefined,
        category: product.category,
        priceUsd: product.priceUsd,
        stock: product.stock,
        minStock: product.minStock,
        description: product.description,
        images: {
          create: product.images.map((url, index) => ({
            url,
            alt: product.name,
            sortOrder: index
          }))
        }
      }
    });

    if (product.stock > 0) {
      await prisma.stockMovement.create({
        data: {
          productId: created.id,
          type: "IN",
          quantity: product.stock,
          reason: "Stock inicial"
        }
      });
    }
  }

  console.log("Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

