/**
 * Initial demo data that gets loaded into sessionStorage on the frontend.
 * This data is returned by GET /demo/initial-data
 */
export const DEMO_INITIAL_DATA = {
  customer: {
    id: 'demo-customer-001',
    email: 'cliente-demo@higinex.com',
    name: 'Empresa Demo S.A.S',
    phone: '+57 300 123 4567',
    documentType: 'NIT',
    documentNumber: '900123456-1',
    addresses: [
      {
        id: 'demo-addr-001',
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
        id: 'demo-addr-002',
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
  },

  products: [
    {
      id: 'demo-prod-001',
      name: 'Jabón Líquido Industrial Premium',
      slug: 'jabon-liquido-industrial-premium',
      description:
        'Jabón líquido de alta espuma para uso continuo en plantas, oficinas y baños institucionales.',
      status: 'PUBLISHED',
      images: [
        {
          id: 'demo-img-001',
          url: '/products/jabon-liquido.jpg',
          altText: 'Jabón Líquido Industrial Premium',
          isDefault: true,
        },
      ],
      variants: [
        {
          id: 'demo-var-001',
          sku: 'JAB-LIQ-3.8L',
          name: 'Galón 3.8 Litros',
          isActive: true,
        },
        {
          id: 'demo-var-002',
          sku: 'JAB-LIQ-20L',
          name: 'Cuñete 20 Litros',
          isActive: true,
        },
      ],
    },
    {
      id: 'demo-prod-002',
      name: 'Desinfectante Multiusos Hospitalario',
      slug: 'desinfectante-multiusos-hospitalario',
      description:
        'Fórmula bactericida y virucida de amplio espectro para desinfección profunda de superficies.',
      status: 'PUBLISHED',
      images: [
        {
          id: 'demo-img-002',
          url: '/products/desinfectante.jpg',
          altText: 'Desinfectante Multiusos Hospitalario',
          isDefault: true,
        },
      ],
      variants: [
        {
          id: 'demo-var-003',
          sku: 'DES-MUL-1L',
          name: 'Botella 1 Litro',
          isActive: true,
        },
        {
          id: 'demo-var-004',
          sku: 'DES-MUL-5L',
          name: 'Galón 5 Litros',
          isActive: true,
        },
      ],
    },
    {
      id: 'demo-prod-003',
      name: 'Gel Antibacterial 70% Alcohol',
      slug: 'gel-antibacterial-70-alcohol',
      description:
        'Antiséptico de secado rápido con humectantes para protección y desinfección inmediata de manos.',
      status: 'PUBLISHED',
      images: [
        {
          id: 'demo-img-003',
          url: '/products/gel-antibacterial.jpg',
          altText: 'Gel Antibacterial 70% Alcohol',
          isDefault: true,
        },
      ],
      variants: [
        {
          id: 'demo-var-005',
          sku: 'GEL-ANT-500ML',
          name: 'Envase 500ml con Válvula',
          isActive: true,
        },
        {
          id: 'demo-var-006',
          sku: 'GEL-ANT-1L',
          name: 'Botella 1 Litro',
          isActive: true,
        },
      ],
    },
    {
      id: 'demo-prod-004',
      name: 'Toallas de Papel Interdobladas',
      slug: 'toallas-papel-interdobladas',
      description:
        'Toallas de papel kraft y blanco doble hoja de alta capacidad de absorción para dispensador.',
      status: 'PUBLISHED',
      images: [
        {
          id: 'demo-img-004',
          url: '/products/toallas-papel.svg',
          altText: 'Toallas de Papel Interdobladas',
          isDefault: true,
        },
      ],
      variants: [
        {
          id: 'demo-var-007',
          sku: 'TOA-INT-150',
          name: 'Paquete x 150 Hojas',
          isActive: true,
        },
        {
          id: 'demo-var-008',
          sku: 'TOA-INT-CJ20',
          name: 'Caja x 20 Paquetes',
          isActive: true,
        },
      ],
    },
    {
      id: 'demo-prod-005',
      name: 'Detergente Desengrasante Concentrado',
      slug: 'detergente-desengrasante-concentrado',
      description:
        'Desengrasante alcalino de alto poder para cocinas industriales, pisos y maquinaria pesada.',
      status: 'PUBLISHED',
      images: [
        {
          id: 'demo-img-005',
          url: '/products/desengrasante.svg',
          altText: 'Detergente Desengrasante Concentrado',
          isDefault: true,
        },
      ],
      variants: [
        {
          id: 'demo-var-009',
          sku: 'DET-DES-4L',
          name: 'Galón 4 Litros',
          isActive: true,
        },
        {
          id: 'demo-var-010',
          sku: 'DET-DES-20L',
          name: 'Caneca 20 Litros',
          isActive: true,
        },
      ],
    },
  ],

  contracts: [
    {
      id: 'demo-contract-001',
      customerId: 'demo-customer-001',
      isActive: true,
      startsAt: new Date().toISOString(),
      endsAt: null,
      items: [
        { variantId: 'demo-var-001', unitPriceCop: 45000 },
        { variantId: 'demo-var-002', unitPriceCop: 180000 },
        { variantId: 'demo-var-003', unitPriceCop: 12000 },
        { variantId: 'demo-var-004', unitPriceCop: 48000 },
        { variantId: 'demo-var-005', unitPriceCop: 15000 },
        { variantId: 'demo-var-006', unitPriceCop: 28000 },
        { variantId: 'demo-var-007', unitPriceCop: 8500 },
        { variantId: 'demo-var-008', unitPriceCop: 155000 },
        { variantId: 'demo-var-009', unitPriceCop: 38000 },
        { variantId: 'demo-var-010', unitPriceCop: 165000 },
      ],
    },
  ],

  inventory: [
    { variantId: 'demo-var-001', onHand: 150, reserved: 0 },
    { variantId: 'demo-var-002', onHand: 50, reserved: 0 },
    { variantId: 'demo-var-003', onHand: 200, reserved: 0 },
    { variantId: 'demo-var-004', onHand: 80, reserved: 0 },
    { variantId: 'demo-var-005', onHand: 300, reserved: 0 },
    { variantId: 'demo-var-006', onHand: 120, reserved: 0 },
    { variantId: 'demo-var-007', onHand: 400, reserved: 0 },
    { variantId: 'demo-var-008', onHand: 100, reserved: 0 },
    { variantId: 'demo-var-009', onHand: 180, reserved: 0 },
    { variantId: 'demo-var-010', onHand: 60, reserved: 0 },
  ],

  orders: [
    {
      id: 'demo-order-1001',
      orderNumber: 'ORD-DEMO-1001',
      status: 'PAID',
      currency: 'COP',
      customerId: 'demo-customer-001',
      buyerFullName: 'Empresa Demo S.A.S',
      buyerEmail: 'cliente-demo@higinex.com',
      buyerPhone: '+57 300 123 4567',
      buyerDocumentType: 'NIT',
      buyerDocumentNumber: '900123456-1',
      subtotalAmount: '225000',
      shippingAmount: '0',
      taxesAmount: '42750',
      discountAmount: '0',
      totalAmount: '267750',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      items: [
        {
          id: 'demo-item-1',
          orderId: 'demo-order-1001',
          variantId: 'demo-var-001',
          productNameSnapshot: 'Jabón Líquido Industrial Premium',
          variantNameSnapshot: 'Galón 3.8 Litros',
          unitPriceAmount: '45000',
          quantity: 3,
          lineTotalAmount: '135000',
        },
        {
          id: 'demo-item-2',
          orderId: 'demo-order-1001',
          variantId: 'demo-var-003',
          productNameSnapshot: 'Desinfectante Multiusos Hospitalario',
          variantNameSnapshot: 'Botella 1 Litro',
          unitPriceAmount: '12000',
          quantity: 5,
          lineTotalAmount: '60000',
        },
        {
          id: 'demo-item-3',
          orderId: 'demo-order-1001',
          variantId: 'demo-var-005',
          productNameSnapshot: 'Gel Antibacterial 70% Alcohol',
          variantNameSnapshot: 'Envase 500ml con Válvula',
          unitPriceAmount: '15000',
          quantity: 2,
          lineTotalAmount: '30000',
        },
      ],
    },
    {
      id: 'demo-order-1002',
      orderNumber: 'ORD-DEMO-1002',
      status: 'PENDING',
      currency: 'COP',
      customerId: 'demo-customer-001',
      buyerFullName: 'Empresa Demo S.A.S',
      buyerEmail: 'cliente-demo@higinex.com',
      buyerPhone: '+57 300 123 4567',
      buyerDocumentType: 'NIT',
      buyerDocumentNumber: '900123456-1',
      subtotalAmount: '335000',
      shippingAmount: '0',
      taxesAmount: '63650',
      discountAmount: '0',
      totalAmount: '398650',
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      items: [
        {
          id: 'demo-item-4',
          orderId: 'demo-order-1002',
          variantId: 'demo-var-002',
          productNameSnapshot: 'Jabón Líquido Industrial Premium',
          variantNameSnapshot: 'Cuñete 20 Litros',
          unitPriceAmount: '180000',
          quantity: 1,
          lineTotalAmount: '180000',
        },
        {
          id: 'demo-item-5',
          orderId: 'demo-order-1002',
          variantId: 'demo-var-008',
          productNameSnapshot: 'Toallas de Papel Interdobladas',
          variantNameSnapshot: 'Caja x 20 Paquetes',
          unitPriceAmount: '155000',
          quantity: 1,
          lineTotalAmount: '155000',
        },
      ],
    },
  ],
};

export const DEMO_ACCOUNTS = {
  admin: 'admin-demo@higinex.com',
  user: 'cliente-demo@higinex.com',
} as const;

export const DEMO_PASSWORD = 'demo123';
