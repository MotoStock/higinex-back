import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { handlePrismaError } from 'src/common/helpers/prisma-error.helper';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCustomerAddressDto } from './dto/create-customer-address.dto';
import { GetCustomerAddressesQueryDto } from './dto/get-customer-addresses-query.dto';
import { GetCustomersQueryDto } from './dto/get-customers-query.dto';
import { UpdateCustomerAddressDto } from './dto/update-customer-address.dto';
import { UpdateCustomerProfileDto } from './dto/update-customer-profile.dto';

const customerAddressSelect = {
  id: true,
  label: true,
  line1: true,
  line2: true,
  neighborhood: true,
  city: true,
  state: true,
  postalCode: true,
  notes: true,
  isDefault: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);
  constructor(private readonly prisma: PrismaService) { }

  async listCustomers({ limit = 10, offset = 0, q }: GetCustomersQueryDto) {
    try {
      const query = q?.trim();
      return await this.prisma.customer.findMany({
        where: {
          deletedAt: null,
          ...(query
            ? {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
                { phone: { contains: query, mode: 'insensitive' } },
                { documentNumber: { contains: query, mode: 'insensitive' } },
              ],
            }
            : {}),
        },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          documentType: true,
          documentNumber: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'CustomersService.listCustomers',
        defaultMessage: 'Failed to list customers',
      });
    }
  }

  async updateCustomerProfile(userId: string, dto: UpdateCustomerProfileDto) {
    try {
      const customer = await this.getCustomerForUser(userId);

      await this.prisma.customer.update({
        where: { id: customer.id },
        data: {
          email: dto.email,
          phone: dto.phone,
        },
      });

      return { message: 'Profile updated successfully' };
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'CustomersService.updateCustomerProfile',
        defaultMessage: 'Failed to update customer profile',
      });
    }
  }

  async getCustomer(customerId: string) {
    try {
      const customer = await this.prisma.customer.findFirst({
        where: { id: customerId, deletedAt: null },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          documentType: true,
          documentNumber: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!customer) throw new NotFoundException('Customer not found');

      return customer;
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'CustomersService.getCustomer',
        defaultMessage: 'Failed to get customer',
      });
    }
  }

  async listCustomerContracts(customerId: string) {
    try {
      const customer = await this.prisma.customer.findFirst({
        where: { id: customerId, deletedAt: null },
        select: { id: true },
      });

      if (!customer) throw new NotFoundException('Customer not found');

      return await this.prisma.contract.findMany({
        where: { customerId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          customerId: true,
          isActive: true,
          startsAt: true,
          endsAt: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { items: true } },
        },
      });
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'CustomersService.listCustomerContracts',
        defaultMessage: 'Failed to list customer contracts',
      });
    }
  }

  async listCustomerAddresses(
    userId: string,
    { limit = 10, offset = 0 }: GetCustomerAddressesQueryDto,
  ) {
    try {
      const customer = await this.getCustomerForUser(userId);

      return await this.prisma.customerAddress.findMany({
        where: { customerId: customer.id, deletedAt: null },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        take: limit,
        skip: offset,
        select: customerAddressSelect,
      });
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'CustomersService.listCustomerAddresses',
        defaultMessage: 'Failed to list customer addresses',
      });
    }
  }

  async createCustomerAddress(userId: string, dto: CreateCustomerAddressDto) {
    try {
      const customer = await this.getCustomerForUser(userId);
      const shouldBeDefault = dto.isDefault === true;

      if (!shouldBeDefault) {
        return await this.prisma.customerAddress.create({
          data: {
            customerId: customer.id,
            label: dto.label,
            line1: dto.line1,
            line2: dto.line2,
            neighborhood: dto.neighborhood,
            city: dto.city,
            state: dto.state,
            postalCode: dto.postalCode,
            notes: dto.notes,
            isDefault: false,
          },
          select: customerAddressSelect,
        });
      }

      return await this.prisma.$transaction(async (tx) => {
        await tx.customerAddress.updateMany({
          where: {
            customerId: customer.id,
            deletedAt: null,
            isDefault: true,
          },
          data: { isDefault: false },
        });

        return await tx.customerAddress.create({
          data: {
            customerId: customer.id,
            label: dto.label,
            line1: dto.line1,
            line2: dto.line2,
            neighborhood: dto.neighborhood,
            city: dto.city,
            state: dto.state,
            postalCode: dto.postalCode,
            notes: dto.notes,
            isDefault: true,
          },
          select: customerAddressSelect,
        });
      });
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'CustomersService.createCustomerAddress',
        defaultMessage: 'Failed to create customer address',
      });
    }
  }

  async updateCustomerAddress(
    userId: string,
    addressId: string,
    dto: UpdateCustomerAddressDto,
  ) {
    try {
      const customer = await this.getCustomerForUser(userId);
      const updated = await this.prisma.customerAddress.updateMany({
        where: { id: addressId, customerId: customer.id, deletedAt: null },
        data: dto,
      });

      if (updated.count === 0) {
        throw new NotFoundException('Address not found');
      }

      return { message: 'Address updated successfully' };
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'CustomersService.updateCustomerAddress',
        defaultMessage: 'Failed to update customer address',
      });
    }
  }

  async deleteCustomerAddress(userId: string, addressId: string) {
    try {
      const customer = await this.getCustomerForUser(userId);
      const updated = await this.prisma.customerAddress.updateMany({
        where: { id: addressId, customerId: customer.id, deletedAt: null },
        data: { deletedAt: new Date(), isDefault: false },
      });

      if (updated.count === 0) {
        throw new NotFoundException('Address not found');
      }

      return { message: 'Address deleted successfully' };
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'CustomersService.deleteCustomerAddress',
        defaultMessage: 'Failed to delete customer address',
      });
    }
  }

  async setDefaultCustomerAddress(userId: string, addressId: string) {
    try {
      const customer = await this.getCustomerForUser(userId);

      await this.prisma.$transaction(async (tx) => {
        const address = await tx.customerAddress.findFirst({
          where: { id: addressId, customerId: customer.id, deletedAt: null },
          select: { id: true },
        });

        if (!address) {
          throw new NotFoundException('Address not found');
        }

        await tx.customerAddress.updateMany({
          where: {
            customerId: customer.id,
            deletedAt: null,
            isDefault: true,
          },
          data: { isDefault: false },
        });

        await tx.customerAddress.update({
          where: { id: address.id },
          data: { isDefault: true },
        });
      });

      return { message: 'Default address updated successfully' };
    } catch (error) {
      handlePrismaError(error, {
        logger: this.logger,
        context: 'CustomersService.setDefaultCustomerAddress',
        defaultMessage: 'Failed to set default customer address',
      });
    }
  }

  private async getCustomerForUser(userId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true },
    });

    if (!customer) {
      throw new BadRequestException('Customer profile not found for user');
    }

    return customer;
  }
}
