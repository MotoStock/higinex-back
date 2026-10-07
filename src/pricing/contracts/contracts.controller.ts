import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractItemDto } from './dto/update-contract-item.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { UpsertContractItemsDto } from './dto/upsert-contract-items.dto';

@Controller('contracts')
@Auth('ADMIN')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post(':customerId')
  async create(
    @Param('customerId') customerId: string,
    @Body() createContractDto: CreateContractDto,
  ) {
    return await this.contractsService.createContract(
      customerId,
      createContractDto,
    );
  }

  @Put(':contractId/items')
  async upsertItems(
    @Param('contractId') contractId: string,
    @Body() upsertContractItemsDto: UpsertContractItemsDto,
  ) {
    return await this.contractsService.upsertContractItems(
      contractId,
      upsertContractItemsDto,
    );
  }

  @Get(':contractId')
  getById(@Param('contractId', ParseUUIDPipe) contractId: string) {
    return this.contractsService.getContract(contractId);
  }

  @Patch(':contractId')
  update(
    @Param('contractId', ParseUUIDPipe) contractId: string,
    @Body() dto: UpdateContractDto,
  ) {
    return this.contractsService.updateContract(contractId, dto);
  }

  @Patch(':contractId/items/:variantId')
  updateItem(
    @Param('contractId', ParseUUIDPipe) contractId: string,
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Body() dto: UpdateContractItemDto,
  ) {
    return this.contractsService.updateContractItem(contractId, variantId, dto);
  }

  @Get(':contractId/items')
  listItems(@Param('contractId', ParseUUIDPipe) contractId: string) {
    return this.contractsService.listContractItems(contractId);
  }

  @Delete(':contractId/items/:variantId')
  removeItem(
    @Param('contractId', ParseUUIDPipe) contractId: string,
    @Param('variantId', ParseUUIDPipe) variantId: string,
  ) {
    return this.contractsService.deleteContractItem(contractId, variantId);
  }

  @Delete(':contractId')
  remove(@Param('contractId', ParseUUIDPipe) contractId: string) {
    return this.contractsService.deleteContract(contractId);
  }
}
