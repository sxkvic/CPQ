import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileBase64Dto } from '../common/file-base64.dto';
import { PaginationDto } from '../common/pagination.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductsService } from './products.service';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  list(@Query() query: PaginationDto) {
    return this.productsService.list(query);
  }

  @Get('export/excel')
  exportExcel() {
    return this.productsService.exportExcel();
  }

  @Post('import/excel')
  importExcel(@Body() dto: FileBase64Dto) {
    return this.productsService.importExcel(dto.fileBase64);
  }

  @Post()
  @Roles('product_manager')
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.productsService.detail(id);
  }

  @Put(':id')
  @Roles('product_manager')
  update(@Param('id') id: string, @Body() dto: CreateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Post(':id/deactivate')
  @Roles('product_manager')
  deactivate(@Param('id') id: string) {
    return this.productsService.deactivate(id);
  }

  @Post(':id/activate')
  @Roles('product_manager')
  activate(@Param('id') id: string) {
    return this.productsService.activate(id);
  }
}
