import mongoose, { Schema } from 'mongoose';

import { schemaOptions } from '../schema-default.options';
import { AgentDBModel } from './agent.entity';

const agentSchema = new Schema<AgentDBModel>(
  {
    name: Schema.Types.String,
    identifier: {
      type: Schema.Types.String,
      index: true,
    },
    _organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    _environmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Environment',
      index: true,
    },
    integrationIds: {
      type: [Schema.Types.ObjectId],
      ref: 'Integration',
    },
  },
  schemaOptions
);

agentSchema.index({ _organizationId: 1 });
agentSchema.index({ _environmentId: 1 });
agentSchema.index({ identifier: 1, _environmentId: 1 }, { unique: true });

export const Agent =
  (mongoose.models.Agent as mongoose.Model<AgentDBModel>) || mongoose.model<AgentDBModel>('Agent', agentSchema);
