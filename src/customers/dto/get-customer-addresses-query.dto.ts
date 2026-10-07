import { PartialType } from '@nestjs/mapped-types';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

export class GetCustomerAddressesQueryDto extends PartialType(
  PaginationQueryDto,
) {}
