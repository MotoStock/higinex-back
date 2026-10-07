import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InvoiceService } from './invoice/invoice.service';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [ConfigModule],
  providers: [NotificationsService, InvoiceService],
  exports: [NotificationsService, InvoiceService],
})
export class NotificationsModule {}
