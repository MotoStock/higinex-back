import 'dotenv/config';
import {
  DocumentType,
  PrismaClient,
  ProductStatus,
  Role,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function seedTestData(client: PrismaClient = prisma): Promise<void> {
  const saltRounds = Number(process.env.SALT_ROUNDS) || 10;
  const clientEmail = (process.env.TEST_CLIENT_EMAIL || 'cliente-demo@higinex.com').trim().toLowerCase();
  const clientPassword = process.env.TEST_CLIENT_PASSWORD || 'demo123';
  const adminDemoEmail = 'admin-demo@higinex.com';
  const adminDemoPassword = 'demo123';

  console.log('\n🌱 [Seed Data] Iniciando siembra de datos de prueba B2B...');

  const hashedClientPassword = await bcrypt.hash(clientPassword, saltRounds);
  const hashedAdminPassword = await bcrypt.hash(adminDemoPassword, saltRounds);

  // 1. Crear / Asegurar Administrador Demo
  const adminDemo = await client.user.upsert({
    where: { email: adminDemoEmail },
    update: {
      role: Role.ADMIN,
      isActive: true,
      emailVerifiedAt: new Date(),
      password: hashedAdminPassword,
    },
    create: {
      email: adminDemoEmail,
      password: hashedAdminPassword,
      role: Role.ADMIN,
      isActive: true,
      emailVerifiedAt: new Date(),
    },
  });
  console.log(`✅ [Seed Data] Administrador demo listo: ${adminDemo.email}`);

  // 2. Crear / Asegurar Usuario Cliente Demo
  const clientUser = await client.user.upsert({
    where: { email: clientEmail },
    update: {
      role: Role.USER,
      isActive: true,
      emailVerifiedAt: new Date(),
      password: hashedClientPassword,
    },
    create: {
      email: clientEmail,
      password: hashedClientPassword,
      role: Role.USER,
      isActive: true,
      emailVerifiedAt: new Date(),
    },
  });
  console.log(`✅ [Seed Data] Usuario cliente listo: ${clientUser.email}`);

  // 3. Crear / Asegurar Perfil de Empresa Cliente B2B (Customer)
  const customer = await client.customer.upsert({
    where: { documentNumber: '900123456-1' },
    update: {
      name: 'Empresa Demo S.A.S',
      email: clientEmail,
      phone: '+57 300 123 4567',
      documentType: DocumentType.NIT,
      userId: clientUser.id,
    },
    create: {
      name: 'Empresa Demo S.A.S',
      email: clientEmail,
      phone: '+57 300 123 4567',
      documentType: DocumentType.NIT,
      documentNumber: '900123456-1',
      userId: clientUser.id,
    },
  });
  console.log(`✅ [Seed Data] Cliente B2B corporativo vinculado: ${customer.name} (NIT: ${customer.documentNumber})`);

  // 4. Crear Direcciones del Cliente B2B
  const existingAddresses = await client.customerAddress.findMany({
    where: { customerId: customer.id },
  });

  if (existingAddresses.length === 0) {
    await client.customerAddress.createMany({
      data: [
        {
          customerId: customer.id,
          label: 'Sede Principal Corporativa',
          line1: 'Carrera 45 #26-85',
          line2: 'Edificio Centro Empresarial, Oficina 301',
          neighborhood: 'Centro Internacional',
          city: 'Bogotá',
          state: 'Cundinamarca',
          postalCode: '110111',
          isDefault: true,
        },
        {
          customerId: customer.id,
          label: 'Bodega de Operaciones',
          line1: 'Calle 80 #100-45',
          line2: 'Parque Industrial Metropolitano',
          neighborhood: 'Fontibón',
          city: 'Bogotá',
          state: 'Cundinamarca',
          postalCode: '110931',
          isDefault: false,
        },
      ],
    });
    console.log('✅ [Seed Data] Direcciones de despacho creadas.');
  }

  // 5. Catálogo de Productos y Variantes de Limpieza e Higiene B2B
  const catalog = [
    {
      name: 'Jabón Líquido Industrial Premium',
      slug: 'jabon-liquido-industrial-premium',
      description: 'Jabón líquido de alta espuma para uso continuo en plantas, oficinas y baños institucionales.',
      variants: [
        { name: 'Galón 3.8 Litros', sku: 'JAB-LIQ-3.8L', price: 45000, stock: 150 },
        { name: 'Cuñete 20 Litros', sku: 'JAB-LIQ-20L', price: 180000, stock: 50 },
      ],
    },
    {
      name: 'Desinfectante Multiusos Hospitalario',
      slug: 'desinfectante-multiusos-hospitalario',
      description: 'Fórmula bactericida y virucida de amplio espectro para desinfección profunda de superficies.',
      variants: [
        { name: 'Botella 1 Litro', sku: 'DES-MUL-1L', price: 12000, stock: 200 },
        { name: 'Galón 5 Litros', sku: 'DES-MUL-5L', price: 48000, stock: 80 },
      ],
    },
    {
      name: 'Gel Antibacterial 70% Alcohol',
      slug: 'gel-antibacterial-70-alcohol',
      description: 'Antiséptico de secado rápido con humectantes para protección y desinfección inmediata de manos.',
      variants: [
        { name: 'Envase 500ml con Válvula', sku: 'GEL-ANT-500ML', price: 15000, stock: 300 },
        { name: 'Botella 1 Litro', sku: 'GEL-ANT-1L', price: 28000, stock: 120 },
      ],
    },
    {
      name: 'Toallas de Papel Interdobladas',
      slug: 'toallas-papel-interdobladas',
      description: 'Toallas de papel kraft y blanco doble hoja de alta capacidad de absorción para dispensador.',
      variants: [
        { name: 'Paquete x 150 Hojas', sku: 'TOA-INT-150', price: 8500, stock: 400 },
        { name: 'Caja x 20 Paquetes', sku: 'TOA-INT-CJ20', price: 155000, stock: 100 },
      ],
    },
    {
      name: 'Detergente Desengrasante Concentrado',
      slug: 'detergente-desengrasante-concentrado',
      description: 'Desengrasante alcalino de alto poder para cocinas industriales, pisos y maquinaria pesada.',
      variants: [
        { name: 'Galón 4 Litros', sku: 'DET-DES-4L', price: 38000, stock: 180 },
        { name: 'Caneca 20 Litros', sku: 'DET-DES-20L', price: 165000, stock: 60 },
      ],
    },
  ];

  const seededVariantPrices: { variantId: string; price: number }[] = [];

  for (const item of catalog) {
    const product = await client.product.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        description: item.description,
        status: ProductStatus.PUBLISHED,
      },
      create: {
        name: item.name,
        slug: item.slug,
        description: item.description,
        status: ProductStatus.PUBLISHED,
      },
    });

    for (const v of item.variants) {
      const variant = await client.productVariant.upsert({
        where: { sku: v.sku },
        update: {
          name: v.name,
          productId: product.id,
          isActive: true,
        },
        create: {
          sku: v.sku,
          name: v.name,
          productId: product.id,
          isActive: true,
        },
      });

      // Asignar o actualizar inventario
      await client.inventoryBalance.upsert({
        where: { variantId: variant.id },
        update: {
          onHand: v.stock,
        },
        create: {
          variantId: variant.id,
          onHand: v.stock,
          reserved: 0,
        },
      });

      seededVariantPrices.push({ variantId: variant.id, price: v.price });
    }
  }
  console.log(`✅ [Seed Data] Catálogo creado: ${catalog.length} productos con variantes e inventario.`);

  // 6. Contrato de Tarifas B2B para el Cliente
  let contract = await client.contract.findFirst({
    where: { customerId: customer.id, isActive: true },
  });

  if (!contract) {
    contract = await client.contract.create({
      data: {
        customerId: customer.id,
        isActive: true,
        startsAt: new Date(),
      },
    });
  }

  for (const vp of seededVariantPrices) {
    await client.contractItem.upsert({
      where: {
        contractId_variantId: {
          contractId: contract.id,
          variantId: vp.variantId,
        },
      },
      update: {
        unitPriceCop: vp.price,
      },
      create: {
        contractId: contract.id,
        variantId: vp.variantId,
        unitPriceCop: vp.price,
      },
    });
  }
  console.log(`✅ [Seed Data] Contrato de precios corporativos B2B asignado exitosamente.`);
  console.log('🎉 [Seed Data] Datos de prueba B2B sembrados correctamente.');
}

// Ejecución directa si se invoca por CLI
if (require.main === module) {
  seedTestData()
    .catch((error) => {
      console.error('❌ [Seed Data] Error sembrando datos de prueba:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
