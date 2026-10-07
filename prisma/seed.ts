import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("Password123!", 10);

  // 1. Create System Users
  const admin = await prisma.user.upsert({
    where: { email: "admin@basketradar.com" },
    update: {},
    create: {
      fullName: "System Admin",
      username: "admin",
      email: "admin@basketradar.com",
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const user = await prisma.user.upsert({
    where: { email: "user@basketradar.com" },
    update: {},
    create: {
      fullName: "John Doe",
      username: "johndoe",
      email: "user@basketradar.com",
      passwordHash,
      role: Role.USER,
    },
  });

  // 2. Create Categories
  const dairy = await prisma.category.upsert({
    where: { name: "Dairy & Eggs" },
    update: {},
    create: { name: "Dairy & Eggs" },
  });

  const bakery = await prisma.category.upsert({
    where: { name: "Bakery" },
    update: {},
    create: { name: "Bakery" },
  });

  // 3. Create Retailers
  const retailerA = await prisma.retailer.upsert({
    where: { name: "SuperMart" },
    update: {},
    create: {
      name: "SuperMart",
      description: "Your daily supermarket for low prices.",
      website: "https://supermart.example.com",
    },
  });

  const retailerB = await prisma.retailer.upsert({
    where: { name: "FreshGrocer" },
    update: {},
    create: {
      name: "FreshGrocer",
      description: "Quality fresh produce and organic goods.",
      website: "https://freshgrocer.example.com",
    },
  });

  // 4. Create Stores
  const storeA = await prisma.store.create({
    data: {
      retailerId: retailerA.id,
      storeName: "SuperMart Downtown",
      address: "123 Main St",
      city: "Metro City",
      latitude: -26.2041,
      longitude: 28.0473,
      openingTime: "08:00",
      closingTime: "20:00",
    },
  });

  // 5. Create Products & Prices
  const milk = await prisma.product.create({
    data: {
      categoryId: dairy.id,
      name: "Full Cream Milk 2L",
      brand: "DairyFresh",
      unit: "2L",
    },
  });

  await prisma.price.createMany({
    data: [
      { productId: milk.id, retailerId: retailerA.id, price: 32.99 },
      {
        productId: milk.id,
        retailerId: retailerB.id,
        price: 29.99,
        isPromotional: true,
      },
    ],
  });

  console.log("Seeding finished successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
