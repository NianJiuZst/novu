import { Module } from '@nestjs/common';
import { GetEnvironmentTags } from './usecases/get-environment-tags';
import { SharedModule } from '../shared/shared.module';
import { AddExternalAuthISsuerUrls } from './usecases/add-external-auth-issuer-urls';
import { EnvironmentsController } from './environments.controller';
import { GenerateJwtUsecase } from './generateJwtUsecase';

@Module({
  imports: [SharedModule],
  controllers: [EnvironmentsController],
  providers: [GetEnvironmentTags, AddExternalAuthISsuerUrls, GenerateJwtUsecase],
  exports: [],
})
export class EnvironmentsModule {}
