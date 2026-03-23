-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "capacity" TEXT,
    "condition" TEXT NOT NULL,
    "batteryHealth" INTEGER,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT NOT NULL DEFAULT 'iphone',
    "priceUsd" REAL NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "productId" TEXT NOT NULL,
    CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "channel" TEXT NOT NULL DEFAULT 'LOCAL',
    "paymentMethod" TEXT NOT NULL DEFAULT 'EFECTIVO',
    "shippingMethod" TEXT NOT NULL DEFAULT 'RETIRO',
    "status" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "subtotalArs" REAL NOT NULL DEFAULT 0,
    "totalArs" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "customerId" TEXT,
    CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SaleItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "priceUsd" REAL NOT NULL,
    "priceArs" REAL NOT NULL,
    "productId" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RepairOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trackingCode" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "issue" TEXT NOT NULL,
    "intakeChannel" TEXT NOT NULL DEFAULT 'LOCAL',
    "shippingMethod" TEXT NOT NULL DEFAULT 'RETIRO',
    "status" TEXT NOT NULL DEFAULT 'INGRESADO',
    "diagnosticNotes" TEXT,
    "repairNotes" TEXT,
    "partsCost" REAL DEFAULT 0,
    "laborCost" REAL DEFAULT 0,
    "finalPrice" REAL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "customerId" TEXT,
    CONSTRAINT "RepairOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RepairUpdate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "note" TEXT,
    "repairOrderId" TEXT NOT NULL,
    CONSTRAINT "RepairUpdate_repairOrderId_fkey" FOREIGN KEY ("repairOrderId") REFERENCES "RepairOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "exchangeRateMode" TEXT NOT NULL DEFAULT 'manual',
    "exchangeRate" REAL NOT NULL DEFAULT 1000,
    "profitMarginPercent" REAL NOT NULL DEFAULT 0,
    "installmentsFeePercent" REAL NOT NULL DEFAULT 0,
    "installmentsCount" INTEGER NOT NULL DEFAULT 3,
    "whatsappNumber" TEXT NOT NULL DEFAULT '5491111111111',
    "shopName" TEXT NOT NULL DEFAULT 'iPhone Lab',
    "exchangeRateApiUrl" TEXT,
    "exchangeRateApiField" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "RepairOrder_trackingCode_key" ON "RepairOrder"("trackingCode");
