import mongoose, { Schema } from 'mongoose';

import { schemaOptions } from '../schema-default.options';
import { EnvironmentVariableDBModel } from './environment-variable.entity';

const environmentVariableValueSchema = new Schema(
  {
    _environmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Environment',
      required: true,
    },
    value: {
      type: Schema.Types.String,
      default: '',
    },
  },
  { _id: false }
);

const environmentVariableSchema = new Schema<EnvironmentVariableDBModel>(
  {
    _organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    key: {
      type: Schema.Types.String,
      required: true,
    },
    isSecret: {
      type: Schema.Types.Boolean,
      default: false,
    },
    values: [environmentVariableValueSchema],
    tags: [Schema.Types.String],
    description: {
      type: Schema.Types.String,
    },
  },
  schemaOptions
);

environmentVariableSchema.index({ _organizationId: 1, key: 1 }, { unique: true });
environmentVariableSchema.index({ _organizationId: 1, createdAt: -1 });

export const EnvironmentVariable =
  (mongoose.models.EnvironmentVariable as mongoose.Model<EnvironmentVariableDBModel>) ||
  mongoose.model<EnvironmentVariableDBModel>('EnvironmentVariable', environmentVariableSchema);
