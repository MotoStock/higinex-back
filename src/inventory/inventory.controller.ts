import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { GetInventoryBalancesQueryDto } from './dto/get-inventory-balances-query.dto';
import { GetInventoryMovementsQueryDto } from './dto/get-inventory-movements-query.dto';
import { InventoryService } from './inventory.service';

@Controller('inventory')
@Auth('ADMIN')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('summary')
  getSummary() {
    return this.inventoryService.getSummary();
  }

  @Get('balances')
  listBalances(@Query() query: GetInventoryBalancesQueryDto) {
    return this.inventoryService.listBalances(query);
  }

  @Get('movements')
  listMovements(@Query() query: GetInventoryMovementsQueryDto) {
    return this.inventoryService.listMovements(query);
  }

  @Post('adjust')
  adjust(@CurrentUser('id') userId: string, @Body() dto: AdjustInventoryDto) {
    return this.inventoryService.adjustStock(userId, dto);
  }
}
