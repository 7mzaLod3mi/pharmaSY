import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { SupplierProductsController } from './supplier-products.controller';
import { SupplierProductsService } from './supplier-products.service';

@Module({
  controllers: [ProductsController, SupplierProductsController],
  providers: [ProductsService, SupplierProductsService],
  exports: [ProductsService, SupplierProductsService],
})
export class ProductsModule {}
