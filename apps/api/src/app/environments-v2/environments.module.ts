import { Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';
import { EnvironmentsController } from './environments.controller';
import { GetEnvironmentTags } from './usecases/get-environment-tags';

@Module({
  imports: [SharedModule],
  controllers: [EnvironmentsController],
  providers: [GetEnvironmentTags],
  exports: [],
})
export class EnvironmentsModule {}
