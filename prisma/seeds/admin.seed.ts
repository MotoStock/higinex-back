import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function seedAdmin(client: PrismaClient = prisma): Promise<void> {
  const email = (process.env.ADMIN_EMAIL || 'admin@higinex.com').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'Admin123*';
  const saltRounds = Number(process.env.SALT_ROUNDS) || 10;

  console.log(`\n🌱 [Seed Admin] Verificando cuenta de administrador: ${email}`);

  const existingAdmin = await client.user.findUnique({
    where: { email },
  });

  const hashedPassword = await bcrypt.hash(password, saltRounds);

  if (existingAdmin) {
    // Si ya existe, nos aseguramos de que esté activo, verificado y con rol ADMIN
    await client.user.update({
      where: { id: existingAdmin.id },
      data: {
        role: Role.ADMIN,
        isActive: true,
        emailVerifiedAt: existingAdmin.emailVerifiedAt ?? new Date(),
        password: hashedPassword,
      },
    });
    console.log(`✅ [Seed Admin] Administrador existente actualizado correctamente: ${email}`);
  } else {
    await client.user.create({
      data: {
        email,
        password: hashedPassword,
        role: Role.ADMIN,
        isActive: true,
        emailVerifiedAt: new Date(),
      },
    });
    console.log(`✅ [Seed Admin] Administrador principal creado exitosamente: ${email}`);
  }
}

// Ejecución directa si se invoca por CLI
if (require.main === module) {
  seedAdmin()
    .catch((error) => {
      console.error('❌ [Seed Admin] Error creando administrador:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
