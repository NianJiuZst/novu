import { ConversationStatusEnum } from '@novu/shared';
import mongoose, { Schema } from 'mongoose';
import { schemaOptions } from '../schema-default.options';
import { ConversationDBModel } from './conversation.entity';

const conversationSchema = new Schema<ConversationDBModel>(
  {
    identifier: {
      type: Schema.Types.String,
      required: true,
    },
    _organizationId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Organization',
    },
    _environmentId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Environment',
    },
    subscriberId: {
      type: Schema.Types.String,
      required: true,
    },
    agentId: {
      type: Schema.Types.String,
      required: true,
    },
    status: {
      type: Schema.Types.String,
      enum: Object.values(ConversationStatusEnum),
      required: true,
      default: ConversationStatusEnum.ACTIVE,
    },
    platform: {
      type: Schema.Types.String,
      required: false,
    },
    platformThreadId: {
      type: Schema.Types.String,
      required: false,
    },
    title: {
      type: Schema.Types.String,
      required: false,
    },
    lastMessageAt: {
      type: Schema.Types.String,
      required: false,
    },
    lastMessagePreview: {
      type: Schema.Types.String,
      required: false,
    },
    messageCount: {
      type: Schema.Types.Number,
      required: true,
      default: 0,
    },
    metadata: {
      type: Schema.Types.Mixed,
      required: false,
    },
  },
  { ...schemaOptions, minimize: false }
);

conversationSchema.index({ _environmentId: 1, identifier: 1 }, { unique: true });
conversationSchema.index({ _environmentId: 1, subscriberId: 1, lastMessageAt: -1 });
conversationSchema.index({ _environmentId: 1, status: 1, lastMessageAt: -1 });
conversationSchema.index(
  { _environmentId: 1, agentId: 1, platformThreadId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      platformThreadId: { $exists: true, $type: 'string', $ne: '' },
    },
  }
);

export const ConversationModel =
  (mongoose.models.Conversation as mongoose.Model<ConversationDBModel>) ||
  mongoose.model<ConversationDBModel>('Conversation', conversationSchema);
