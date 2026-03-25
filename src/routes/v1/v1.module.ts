import { Module } from '@nestjs/common';
import { CustomerModule } from './customer/customer.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [CustomerModule, AdminModule],
})
export class V1Module {}
