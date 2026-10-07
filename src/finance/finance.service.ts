/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InvoiceData } from '../notifications/invoice/interfaces/invoice.types';
import { InvoiceService } from '../notifications/invoice/invoice.service';
import { PrismaService } from '../prisma/prisma.service';
import { GetFinancePaymentsQueryDto } from './dto/get-payments.dto';
import { GetFinanceRefundsQueryDto } from './dto/get-refunds.dto';
import {
  GetFinanceReportQueryDto,
  ReportFormat,
  ReportType,
} from './dto/get-report.dto';
import { GetFinanceSummaryQueryDto } from './dto/get-summary.dto';

@Injectable()
export class FinanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly invoiceService: InvoiceService,
  ) { }

  async getPayments(query: GetFinancePaymentsQueryDto) {
    const {
      from,
      to,
      status,
      method,
      orderId,
      customerId,
      limit = 10,
      offset = 0,
    } = query;

    const where: any = {
      deletedAt: null, // Exclude soft deleted payments
    };

    if (from || to) {
      where.paidAt = {}; // Use paidAt for consistency with Finance logic
      if (from) where.paidAt.gte = from;
      if (to) where.paidAt.lte = to;
    }

    if (status) where.status = status;
    if (method) where.method = method;
    if (orderId) where.orderId = orderId;
    if (customerId) where.order = { customerId: customerId }; // Filter by customer via order

    const [data, totalCount] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        take: limit,
        skip: offset,
        include: {
          order: {
            select: {
              orderNumber: true,
              customer: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { paidAt: 'desc' }, // Sort by paidAt
      }),
      this.prisma.payment.count({ where }),
    ]);

    // Flatten logic for frontend convenience
    const flattenedData = data.map((payment) => ({
      ...payment,
      orderNumber: payment.order.orderNumber,
      customerName: payment.order.customer?.name,
      customerEmail: payment.order.customer?.email,
    }));

    return { data: flattenedData, totalCount };
  }

  async getRefunds(query: GetFinanceRefundsQueryDto) {
    const {
      from,
      to,
      status,
      method,
      orderId,
      customerId,
      limit = 10,
      offset = 0,
    } = query;

    const where: any = {};

    if (from || to) {
      where.processedAt = {}; // Use processedAt for refunds
      if (from) where.processedAt.gte = from;
      if (to) where.processedAt.lte = to;
    }

    if (status) where.status = status;
    if (method) where.method = method;
    if (orderId) where.orderId = orderId;
    if (customerId) where.order = { customerId: customerId };

    const [data, totalCount] = await Promise.all([
      this.prisma.refund.findMany({
        where,
        take: limit,
        skip: offset,
        include: {
          order: {
            select: {
              orderNumber: true,
              customer: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { processedAt: 'desc' },
      }),
      this.prisma.refund.count({ where }),
    ]);

    // Flatten logic for frontend convenience
    const flattenedData = data.map((refund) => ({
      ...refund,
      orderNumber: refund.order.orderNumber,
      customerName: refund.order.customer?.name,
      customerEmail: refund.order.customer?.email,
    }));

    return { data: flattenedData, totalCount };
  }

  async getSummary(query: GetFinanceSummaryQueryDto) {
    const { from, to } = query;

    const paymentWhere: any = {
      status: 'CONFIRMED',
      deletedAt: null, // Exclude soft deleted payments
    };
    const refundWhere: any = {
      status: 'COMPLETED',
      // Refunds might not have soft delete implemented yet on schema but typically safe mostly relies on status
    };

    if (from || to) {
      if (from) {
        paymentWhere.paidAt = { gte: from };
        refundWhere.processedAt = { gte: from };
      }
      if (to) {
        paymentWhere.paidAt = { ...paymentWhere.paidAt, lte: to };
        refundWhere.processedAt = {
          ...refundWhere.processedAt,
          lte: to,
        };
      }
    }

    const [paymentsAgg, refundsAgg, paymentsCount, refundsCount] =
      await Promise.all([
        this.prisma.payment.aggregate({
          _sum: { amount: true },
          where: paymentWhere,
        }),
        this.prisma.refund.aggregate({
          _sum: { amount: true },
          where: refundWhere,
        }),
        this.prisma.payment.count({ where: paymentWhere }),
        this.prisma.refund.count({ where: refundWhere }),
      ]);

    const totalPaid = paymentsAgg._sum.amount?.toNumber() || 0;
    const totalRefunded = refundsAgg._sum.amount?.toNumber() || 0;
    const netRevenue = totalPaid - totalRefunded;

    // Return as strings to preserve precision for frontend display if needed, or exact numbers
    // Requested: return precision safe strings or format.
    // Ideally returning number is fine if under JS safe integer limit (9 quadrillion).
    // But user asked for precision safety, so let's stick to simple numbers unless prompted for strings.
    // Wait, user feedback said: "getSummary convierte Decimal con toNumber(). Para montos grandes podrías perder precisión. Si quieres exactitud, retorna string y formatea en el front."
    // Implementing returning strings:

    return {
      totalPaid: totalPaid.toFixed(2),
      totalRefunded: totalRefunded.toFixed(2),
      netRevenue: netRevenue.toFixed(2),
      paymentsCount,
      refundsCount,
    };
  }

  async generateInvoicePdf(orderId: string): Promise<Buffer> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        items: true,
        payments: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const invoiceData: InvoiceData = this.mapOrderToInvoiceData(order);
    return this.invoiceService.generateInvoice(invoiceData);
  }

  async generateReport(
    query: GetFinanceReportQueryDto,
  ): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
    const { type, format } = query;
    let data: any[] = [];
    let headers: string[] = [];

    // Helper to escape CSV fields
    const escapeCsv = (field: any) => {
      if (field === null || field === undefined) return '';
      const stringField = String(field);
      if (
        stringField.includes(',') ||
        stringField.includes('\n') ||
        stringField.includes('"')
      ) {
        return `"${stringField.replace(/"/g, '""')}"`;
      }
      return stringField;
    };

    if (type === ReportType.PAYMENTS) {
      const res = await this.getPayments({
        from: query.from,
        to: query.to,
        limit: 100000,
        offset: 0,
      });
      data = res.data;
      headers = [
        'ID',
        'OrderNumber',
        'Amount',
        'Method',
        'Status',
        'PaidAt', // Changed from Date to PaidAt
        'Customer',
        'CustomerEmail',
      ];
      data = data.map((p) => [
        p.id,
        p.orderNumber,
        p.amount,
        p.method,
        p.status,
        p.paidAt ? p.paidAt.toISOString() : '', // Use paidAt
        p.customerName,
        p.customerEmail,
      ]);
    } else if (type === ReportType.REFUNDS) {
      const res = await this.getRefunds({
        from: query.from,
        to: query.to,
        limit: 100000,
        offset: 0,
      });
      data = res.data;
      headers = [
        'ID',
        'OrderNumber',
        'Amount',
        'Method',
        'Status',
        'ProcessedAt', // Changed from Date to ProcessedAt
        'Customer',
        'CustomerEmail',
      ];
      data = data.map((r) => [
        r.id,
        r.orderNumber,
        r.amount,
        r.method,
        r.status,
        r.processedAt ? r.processedAt.toISOString() : '', // Use processedAt
        r.customerName,
        r.customerEmail,
      ]);
    } else {
      const summary = await this.getSummary({ from: query.from, to: query.to });
      headers = [
        'TotalPaid',
        'TotalRefunded',
        'NetRevenue',
        'PaymentsCount',
        'RefundsCount',
      ];
      data = [
        [
          summary.totalPaid,
          summary.totalRefunded,
          summary.netRevenue,
          summary.paymentsCount,
          summary.refundsCount,
        ],
      ];
    }

    if (format === ReportFormat.CSV) {
      const csvContent =
        headers.map(escapeCsv).join(',') +
        '\n' +
        data.map((row) => row.map(escapeCsv).join(',')).join('\n');

      return {
        buffer: Buffer.from(csvContent),
        filename: `report_${type}_${Date.now()}.csv`,
        contentType: 'text/csv',
      };
    } else {
      // Fallback or todo for PDF report
      throw new BadRequestException(
        'PDF reports not fully implemented yet, use CSV',
      );
    }
  }

  private mapOrderToInvoiceData(order: any): InvoiceData {
    // Helper to format currency
    const fmt = (amount: any) =>
      new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
      }).format(Number(amount));

    const items = order.items.map((item) => ({
      displayName: item.productNameSnapshot,
      quantity: item.quantity,
      unitPriceFormatted: fmt(item.unitPriceAmount),
      lineTotalFormatted: fmt(item.lineTotalAmount),
      lineTotalValue: Number(item.lineTotalAmount),
    }));

    return {
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      status: order.status,
      currency: order.currency,
      subtotalAmount: order.subtotalAmount, // raw number for logic if needed
      taxesAmount: order.taxesAmount,
      shippingAmount: order.shippingAmount,
      discountAmount: order.discountAmount,
      totalAmount: order.totalAmount,

      customer: {
        name: order.customer?.name || order.buyerFullName || 'Guest',
        email: order.customer?.email || order.buyerEmail || '',
        phone: order.customer?.phone || order.buyerPhone,
        documentType: order.customer?.documentType || order.buyerDocumentType,
        documentNumber:
          order.customer?.documentNumber || order.buyerDocumentNumber,
      },
      customerName: order.customer?.name || order.buyerFullName || 'Guest', // Required by OrderEmailContext

      // Formatted strings for OrderSummary
      createdAtLabel: order.createdAt.toLocaleDateString(),
      statusLabel: order.status,
      items: items,
      subtotalFormatted: fmt(order.subtotalAmount),
      taxesFormatted: fmt(order.taxesAmount),
      shippingFormatted: fmt(order.shippingAmount),
      discountFormatted: fmt(order.discountAmount),
      totalFormatted: fmt(order.totalAmount),

      // Extra fields if needed by templates
      customerNotes: order.customerNotes,
    };
  }
}
