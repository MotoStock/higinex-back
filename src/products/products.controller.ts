import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { GetAllProductQueryDto } from './dto/get-all-product-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@Controller('products')
@Auth()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Auth('ADMIN')
  async createProduct(@Body() createProductDto: CreateProductDto) {
    return await this.productsService.createProduct(createProductDto);
  }

  @Get()
  async getAllProducts(@Query() query: GetAllProductQueryDto) {
    return await this.productsService.getAllProducts(query);
  }

  @Patch('publish/:id')
  @Auth('ADMIN')
  async setProductPublished(@Param('id', ParseUUIDPipe) id: string) {
    return await this.productsService.setProductPublished(id);
  }

  @Patch('archive/:id')
  @Auth('ADMIN')
  async setProductArchived(@Param('id', ParseUUIDPipe) id: string) {
    return await this.productsService.setProductArchived(id);
  }

  @Patch('update/:id')
  @Auth('ADMIN')
  async updateProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return await this.productsService.updateProduct(id, updateProductDto);
  }

  @Get('list-variants/:id')
  async listProductVariants(@Param('id', ParseUUIDPipe) id: string) {
    return await this.productsService.listProductVariants(id);
  }
}
