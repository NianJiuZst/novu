import { Injectable } from '@nestjs/common';
import { JsonSchemaTypeEnum } from '@novu/dal';
import { LAYOUT_CONTENT_VARIABLE } from '@novu/shared';
import { InstrumentUsecase } from '../../../instrumentation';
import { JSONSchemaDto } from '../../../utils/shared/dtos/json-schema.dto';
import { buildSubscriberSchema } from '../../../utils/shared/utils/create-schema';
import { CreateVariablesObject, CreateVariablesObjectCommand } from '../../create-variables-object';
import { LayoutVariablesSchemaCommand } from './layout-variables-schema.command';

@Injectable()
export class LayoutVariablesSchemaUseCase {
  constructor(private readonly createVariablesObject: CreateVariablesObject) {}

  @InstrumentUsecase()
  async execute(command: LayoutVariablesSchemaCommand): Promise<JSONSchemaDto> {
    const { controlValues } = command;

    const { subscriber } = await this.createVariablesObject.execute(
      CreateVariablesObjectCommand.create({
        environmentId: command.environmentId,
        organizationId: command.organizationId,
        controlValues: Object.values(controlValues?.email ?? {}),
      })
    );

    return {
      type: JsonSchemaTypeEnum.OBJECT,
      properties: {
        subscriber: buildSubscriberSchema(subscriber),
        [LAYOUT_CONTENT_VARIABLE]: {
          type: JsonSchemaTypeEnum.STRING,
        },
      },
      additionalProperties: false,
    };
  }
}
