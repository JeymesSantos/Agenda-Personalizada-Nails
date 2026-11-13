-- CreateEnum
CREATE TYPE "BackgroundKind" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "BackgroundPage" AS ENUM ('PUBLIC_DEFAULT', 'PUBLIC_HOME', 'PUBLIC_SERVICES', 'PUBLIC_PORTFOLIO', 'PUBLIC_BOOKING', 'PUBLIC_MY_APPOINTMENTS', 'PUBLIC_CONFIRMATION', 'PUBLIC_LOGIN', 'ADMIN_DEFAULT', 'ADMIN_DASHBOARD', 'ADMIN_AGENDA', 'ADMIN_SERVICES', 'ADMIN_PORTFOLIO', 'ADMIN_EXPENSES', 'ADMIN_CLIENTS', 'ADMIN_BIO', 'ADMIN_AVAILABILITY', 'ADMIN_MORE');

-- CreateEnum
CREATE TYPE "BackgroundVeil" AS ENUM ('LIGHT', 'MEDIUM', 'DENSE');

-- CreateTable
CREATE TABLE "BackgroundMedia" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "kind" "BackgroundKind" NOT NULL,
    "url" TEXT NOT NULL,
    "posterUrl" TEXT,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BackgroundMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackgroundAssignment" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "page" "BackgroundPage" NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BackgroundAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackgroundPageSetting" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "page" "BackgroundPage" NOT NULL,
    "veil" "BackgroundVeil" NOT NULL DEFAULT 'MEDIUM',

    CONSTRAINT "BackgroundPageSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BackgroundMedia_businessId_order_idx" ON "BackgroundMedia"("businessId", "order");

-- CreateIndex
CREATE INDEX "BackgroundAssignment_businessId_page_order_idx" ON "BackgroundAssignment"("businessId", "page", "order");

-- CreateIndex
CREATE UNIQUE INDEX "BackgroundAssignment_mediaId_page_key" ON "BackgroundAssignment"("mediaId", "page");

-- CreateIndex
CREATE UNIQUE INDEX "BackgroundPageSetting_businessId_page_key" ON "BackgroundPageSetting"("businessId", "page");

-- AddForeignKey
ALTER TABLE "BackgroundMedia" ADD CONSTRAINT "BackgroundMedia_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackgroundAssignment" ADD CONSTRAINT "BackgroundAssignment_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackgroundAssignment" ADD CONSTRAINT "BackgroundAssignment_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "BackgroundMedia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackgroundPageSetting" ADD CONSTRAINT "BackgroundPageSetting_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
