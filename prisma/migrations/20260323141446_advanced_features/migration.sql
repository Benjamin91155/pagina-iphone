-- CreateTable
CREATE TABLE "StockLot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "remaining" INTEGER NOT NULL,
    "costUsd" REAL,
    "notes" TEXT,
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockLot_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "saleId" TEXT,
    "repairOrderId" TEXT,
    "lotId" TEXT,
    CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_repairOrderId_fkey" FOREIGN KEY ("repairOrderId") REFERENCES "RepairOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "StockLot" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
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
    "minStock" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Product" ("batteryHealth", "capacity", "category", "condition", "createdAt", "description", "id", "isUsed", "model", "name", "priceUsd", "slug", "stock", "updatedAt") SELECT "batteryHealth", "capacity", "category", "condition", "createdAt", "description", "id", "isUsed", "model", "name", "priceUsd", "slug", "stock", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
CREATE TABLE "new_RepairOrder" (
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
    "photos" TEXT,
    "quoteApproved" BOOLEAN NOT NULL DEFAULT false,
    "quoteApprovedAt" DATETIME,
    "quoteNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "customerId" TEXT,
    CONSTRAINT "RepairOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_RepairOrder" ("createdAt", "customerId", "customerName", "diagnosticNotes", "finalPrice", "id", "intakeChannel", "issue", "laborCost", "model", "partsCost", "phone", "repairNotes", "shippingMethod", "status", "trackingCode", "updatedAt") SELECT "createdAt", "customerId", "customerName", "diagnosticNotes", "finalPrice", "id", "intakeChannel", "issue", "laborCost", "model", "partsCost", "phone", "repairNotes", "shippingMethod", "status", "trackingCode", "updatedAt" FROM "RepairOrder";
DROP TABLE "RepairOrder";
ALTER TABLE "new_RepairOrder" RENAME TO "RepairOrder";
CREATE UNIQUE INDEX "RepairOrder_trackingCode_key" ON "RepairOrder"("trackingCode");
CREATE TABLE "new_Sale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "channel" TEXT NOT NULL DEFAULT 'LOCAL',
    "paymentMethod" TEXT NOT NULL DEFAULT 'EFECTIVO',
    "shippingMethod" TEXT NOT NULL DEFAULT 'RETIRO',
    "status" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "subtotalArs" REAL NOT NULL DEFAULT 0,
    "totalArs" REAL NOT NULL DEFAULT 0,
    "invoiceNumber" INTEGER NOT NULL DEFAULT 0,
    "soldBy" TEXT,
    "notes" TEXT,
    "customerId" TEXT,
    CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Sale" ("channel", "createdAt", "customerId", "id", "notes", "paymentMethod", "shippingMethod", "status", "subtotalArs", "totalArs") SELECT "channel", "createdAt", "customerId", "id", "notes", "paymentMethod", "shippingMethod", "status", "subtotalArs", "totalArs" FROM "Sale";
DROP TABLE "Sale";
ALTER TABLE "new_Sale" RENAME TO "Sale";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
