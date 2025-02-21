import { Module } from '@nestjs/common';
import { EnvironmentsController } from './environments.controller';
import { GetEnvironmentTags } from './usecases/get-environment-tags';
import { SharedModule } from '../shared/shared.module';
import { AddExternalAuthISsuerUrls } from './usecases/add-external-auth-issuer-urls';

@Module({
  imports: [SharedModule],
  controllers: [EnvironmentsController],
  providers: [GetEnvironmentTags, AddExternalAuthISsuerUrls],
  exports: [],
})
export class EnvironmentsModule {}
