import { Module } from '@nestjs/common';
import { GetEnvironmentTags } from './usecases/get-environment-tags';
import { SharedModule } from '../shared/shared.module';
import { EnvironmentsController } from './environments.controller';
import { GenerateJwtUsecase } from './generateJwtUsecase';

@Module({
  imports: [SharedModule],
  controllers: [EnvironmentsController],
  providers: [GetEnvironmentTags, GenerateJwtUsecase],
  exports: [],
})
export class EnvironmentsModule {}
