import { Module } from '@nestjs/common';
import { InventoryModule } from 'src/inventory/inventory.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { PricingModule } from 'src/pricing/pricing.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { OrderReservationsScheduler } from './order-reservations.scheduler';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [PrismaModule, InventoryModule, PricingModule, NotificationsModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderReservationsScheduler],
})
export class OrdersModule {}
