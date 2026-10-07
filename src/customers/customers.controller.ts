import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { CustomersService } from './customers.service';
import { CreateCustomerAddressDto } from './dto/create-customer-address.dto';
import { GetCustomerAddressesQueryDto } from './dto/get-customer-addresses-query.dto';
import { GetCustomersQueryDto } from './dto/get-customers-query.dto';
import { UpdateCustomerAddressDto } from './dto/update-customer-address.dto';
import { UpdateCustomerProfileDto } from './dto/update-customer-profile.dto';

@Controller('customers')
@Auth()
export class CustomersController {
  constructor(private readonly customersService: CustomersService) { }

  @Get('me/addresses')
  async listAddresses(
    @CurrentUser('id') userId: string,
    @Query() query: GetCustomerAddressesQueryDto,
  ) {
    return await this.customersService.listCustomerAddresses(userId, query);
  }

  @Post('me/addresses')
  async createAddress(
    @CurrentUser('id') userId: string,
    @Body() createAddressDto: CreateCustomerAddressDto,
  ) {
    return await this.customersService.createCustomerAddress(
      userId,
      createAddressDto,
    );
  }

  @Patch('me/addresses/:addressId')
  async updateAddress(
    @CurrentUser('id') userId: string,
    @Param('addressId', ParseUUIDPipe) addressId: string,
    @Body() updateAddressDto: UpdateCustomerAddressDto,
  ) {
    return await this.customersService.updateCustomerAddress(
      userId,
      addressId,
      updateAddressDto,
    );
  }

  @Delete('me/addresses/:addressId')
  async deleteAddress(
    @CurrentUser('id') userId: string,
    @Param('addressId', ParseUUIDPipe) addressId: string,
  ) {
    return await this.customersService.deleteCustomerAddress(userId, addressId);
  }

  @Patch('me/addresses/:addressId/default')
  async setDefaultAddress(
    @CurrentUser('id') userId: string,
    @Param('addressId', ParseUUIDPipe) addressId: string,
  ) {
    return await this.customersService.setDefaultCustomerAddress(
      userId,
      addressId,
    );
  }

  @Patch('me')
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateCustomerProfileDto,
  ) {
    return await this.customersService.updateCustomerProfile(userId, dto);
  }

  @Get()
  @Auth('ADMIN')
  async list(@Query() query: GetCustomersQueryDto) {
    return await this.customersService.listCustomers(query);
  }

  @Get(':customerId')
  @Auth('ADMIN')
  async getById(@Param('customerId', ParseUUIDPipe) customerId: string) {
    return await this.customersService.getCustomer(customerId);
  }

  @Get(':customerId/contracts')
  @Auth('ADMIN')
  async listContracts(@Param('customerId', ParseUUIDPipe) customerId: string) {
    return await this.customersService.listCustomerContracts(customerId);
  }
}
