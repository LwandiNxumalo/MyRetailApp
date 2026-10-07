/*
  Warnings:

  - You are about to drop the column `name` on the `Store` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `storeName` to the `Store` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fullName` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Retailer" ADD COLUMN     "contactNumber" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "Store" DROP COLUMN "name",
ADD COLUMN     "closingTime" TEXT,
ADD COLUMN     "openingTime" TEXT,
ADD COLUMN     "storeName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "name",
ADD COLUMN     "fullName" TEXT NOT NULL,
ADD COLUMN     "lastLogin" TIMESTAMP(3),
ADD COLUMN     "resetPasswordExpires" TIMESTAMP(3),
ADD COLUMN     "resetPasswordToken" TEXT,
ADD COLUMN     "username" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
