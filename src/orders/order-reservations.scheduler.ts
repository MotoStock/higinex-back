import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrdersService } from './orders.service';

@Injectable()
export class OrderReservationsScheduler
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(OrderReservationsScheduler.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly ordersService: OrdersService,
  ) {}

  onModuleInit() {
    const intervalMinutes =
      this.configService.get<number>('RESERVATION_CLEANUP_INTERVAL_MINUTES') ??
      10;

    if (intervalMinutes <= 0) {
      this.logger.warn(
        'Reservation cleanup scheduler disabled (interval <= 0)',
      );
      return;
    }

    this.timer = setInterval(
      () => void this.runCleanup(),
      intervalMinutes * 60 * 1000,
    );

    this.timer.unref?.();
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private async runCleanup() {
    try {
      const result = await this.ordersService.expireReservations();
      if (result?.expiredCount) {
        this.logger.log(
          `Expired ${result.expiredCount} reservations (checked ${result.checkedCount})`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to expire reservations', error as Error);
    }
  }
}
