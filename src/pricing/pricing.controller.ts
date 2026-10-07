import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { PricingService } from './pricing.service';

@Controller('pricing')
@Auth()
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get('variants/:variantId')
  async getVariantPrice(
    @CurrentUser('id') userId: string,
    @Param('variantId', ParseUUIDPipe) variantId: string,
  ) {
    return await this.pricingService.getVariantPriceForUser(userId, variantId);
  }
}
