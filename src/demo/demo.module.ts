import { Module } from '@nestjs/common';
import { DemoController } from './demo.controller';
import { DemoService } from './demo.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [NotificationsModule, PrismaModule],
  controllers: [DemoController],
  providers: [DemoService],
})
export class DemoModule {}
