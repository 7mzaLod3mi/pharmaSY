import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ImportService } from './import.service';
import { ImportController } from './import.controller';
import { ImportProcessor } from './processors/import.processor';
import { ProductsModule } from '../products/products.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'product-import' }),
    ProductsModule,
    UploadModule,
  ],
  controllers: [ImportController],
  providers: [ImportService, ImportProcessor],
  exports: [ImportService],
})
export class ImportModule {}
