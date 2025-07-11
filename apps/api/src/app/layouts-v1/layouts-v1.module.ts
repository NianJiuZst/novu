import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ChangeModule } from '../change/change.module';
import { MessageTemplateModule } from '../message-template/message-template.module';
import { SharedModule } from '../shared/shared.module';
import { LayoutsControllerV1 } from './layouts-v1.controller';
import { USE_CASES } from './usecases';

@Module({
  imports: [SharedModule, ChangeModule, MessageTemplateModule, forwardRef(() => AuthModule)],
  providers: [...USE_CASES],
  exports: [...USE_CASES],
  controllers: [LayoutsControllerV1],
})
export class LayoutsV1Module {}
