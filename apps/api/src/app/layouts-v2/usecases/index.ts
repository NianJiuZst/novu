import { DeleteLayoutUseCase } from './delete-layout';
import { DuplicateLayoutUseCase } from './duplicate-layout';
import { GetLayoutUseCase } from './get-layout';
import { LayoutVariablesSchemaUseCase } from './layout-variables-schema';
import { ListLayoutsUseCase } from './list-layouts';
import { PreviewLayoutUsecase } from './preview-layout';
import { UpsertLayoutUseCase } from './upsert-layout';

export const USE_CASES = [
  UpsertLayoutUseCase,
  GetLayoutUseCase,
  DeleteLayoutUseCase,
  DuplicateLayoutUseCase,
  ListLayoutsUseCase,
  LayoutVariablesSchemaUseCase,
  PreviewLayoutUsecase,
];
