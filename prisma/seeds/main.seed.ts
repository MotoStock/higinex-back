import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { seedAdmin } from './admin.seed';
import { seedTestData } from './test-data.seed';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 [Seed Higinex] Iniciando siembra completa de base de datos...');
  try {
    await seedAdmin(prisma);
    await seedTestData(prisma);
    console.log('\n✨ [Seed Higinex] Proceso de siembra finalizado con éxito.\n');
  } catch (error) {
    console.error('❌ [Seed Higinex] Error durante la ejecución de seeds:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
