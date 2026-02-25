import "dotenv/config";
import { prisma } from "../lib/db";
import { hash } from "bcryptjs";

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@addi.local";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await hash(adminPassword, 12);
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: "Admin",
        role: "admin",
      },
    });
    console.log("Created admin user:", adminEmail);
  } else {
    console.log("Admin user already exists:", adminEmail);
  }

  const productCount = await prisma.product.count();
  if (productCount === 0) {
    await prisma.product.create({
      data: {
        name: "Classic Sourdough",
        description: "Traditional slow-fermented sourdough with a crisp crust and tangy flavor.",
        price: 8.5,
        isActive: true,
      },
    });
    console.log("Created sample product: Classic Sourdough");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
