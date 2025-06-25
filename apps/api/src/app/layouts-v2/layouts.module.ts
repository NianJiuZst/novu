import { Module } from '@nestjs/common';
import { GetLayoutUseCase } from '@novu/application-generic';
import { DeleteLayoutUseCase, CreateLayoutUseCase } from '../layouts/usecases';
import { LayoutsV2Controller } from './layouts.controller';
import { USE_CASES } from './usecases';

const PROVIDERS = [
  ...USE_CASES,
  GetLayoutUseCase,
  DeleteLayoutUseCase,
  CreateLayoutUseCase,
];

@Module({
  imports: [],
  controllers: [LayoutsV2Controller],
  providers: [...PROVIDERS],
  exports: [...PROVIDERS],
})
export class LayoutsV2Module {}
