import { Injectable, Logger } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { endOfDay, startOfDay, startOfMonth } from 'date-fns';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) { }

  async getDashboardSummary() {
    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);

    const periodStats = await this.getPeriodStats(
      startOfCurrentMonth,
      endOfDay(now),
    );
    const operationalStats = await this.getCurrentOperationalStats();

    return {
      period: {
        from: startOfCurrentMonth,
        to: endOfDay(now),
      },
      ...periodStats,
      operational: operationalStats,
    };
  }

  async getReport(from: Date, to: Date) {
    const periodStats = await this.getPeriodStats(
      startOfDay(from),
      endOfDay(to),
    );

    return {
      period: {
        from: startOfDay(from),
        to: endOfDay(to),
      },
      ...periodStats,
    };
  }

  private async getPeriodStats(start: Date, end: Date) {
    // 1. Orders Paid in Period (Count of orders with paidAt in range)
    const ordersCount = await this.prisma.order.count({
      where: {
        paidAt: {
          gte: start,
          lte: end,
        },
        deletedAt: null,
      },
    });

    // 2. Gross Revenue (Confirmed Payments in Period)
    const paymentsAgg = await this.prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: 'CONFIRMED',
        paidAt: {
          gte: start,
          lte: end,
        },
        deletedAt: null,
      },
    });

    // 3. Refunds (Completed Refunds in Period)
    const refundsAgg = await this.prisma.refund.aggregate({
      _sum: { amount: true },
      where: {
        status: 'COMPLETED',
        processedAt: {
          gte: start,
          lte: end,
        },
      },
    });

    const totalPaid = paymentsAgg._sum.amount?.toNumber() || 0;
    const totalRefunded = refundsAgg._sum.amount?.toNumber() || 0;
    const revenue = totalPaid - totalRefunded;

    return {
      ordersCount,
      revenue,
    };
  }

  private async getCurrentOperationalStats() {
    // Pendientes de Pago: PENDING_PAYMENT
    const pendingCount = await this.prisma.order.count({
      where: {
        status: OrderStatus.PENDING_PAYMENT,
        deletedAt: null,
      },
    });

    // En Preparación: PREPARING
    const preparingCount = await this.prisma.order.count({
      where: {
        status: OrderStatus.PREPARING,
        deletedAt: null,
      },
    });

    // En Ruta: SHIPPED
    const shippedCount = await this.prisma.order.count({
      where: {
        status: OrderStatus.SHIPPED,
        deletedAt: null,
      },
    });

    return {
      pending: pendingCount,
      preparing: preparingCount,
      shipped: shippedCount,
    };
  }
}
