import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ContractsController } from './contracts/contracts.controller';
import { ContractsService } from './contracts/contracts.service';
import { PricingController } from './pricing.controller';
import { PricingService } from './pricing.service';

@Module({
  imports: [PrismaModule],
  controllers: [PricingController, ContractsController],
  providers: [PricingService, ContractsService],
  exports: [PricingService],
})
export class PricingModule {}
