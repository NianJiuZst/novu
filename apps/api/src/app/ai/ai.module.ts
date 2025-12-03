import { Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';
import { AiController } from './ai.controller';
import { GenerateContentUseCase } from './usecases/generate-content';

@Module({
  imports: [SharedModule],
  controllers: [AiController],
  providers: [GenerateContentUseCase],
  exports: [],
})
export class AiModule {}



