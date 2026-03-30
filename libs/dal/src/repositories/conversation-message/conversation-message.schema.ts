import { ConversationMessageRoleEnum } from '@novu/shared';
import mongoose, { Schema } from 'mongoose';
import { schemaOptions } from '../schema-default.options';
import { ConversationMessageDBModel } from './conversation-message.entity';

const conversationMessageSchema = new Schema<ConversationMessageDBModel>(
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
    _conversationId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Conversation',
    },
    role: {
      type: Schema.Types.String,
      enum: Object.values(ConversationMessageRoleEnum),
      required: true,
    },
    content: {
      type: Schema.Types.String,
      required: true,
    },
    senderName: {
      type: Schema.Types.String,
      required: false,
    },
    senderAvatar: {
      type: Schema.Types.String,
      required: false,
    },
    platform: {
      type: Schema.Types.String,
      required: false,
    },
    platformMessageId: {
      type: Schema.Types.String,
      required: false,
    },
    metadata: {
      type: Schema.Types.Mixed,
      required: false,
    },
  },
  { ...schemaOptions, minimize: false }
);

conversationMessageSchema.index({ _environmentId: 1, identifier: 1 }, { unique: true });
conversationMessageSchema.index({ _environmentId: 1, _conversationId: 1, createdAt: 1 });
conversationMessageSchema.index(
  { _environmentId: 1, _conversationId: 1, platformMessageId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      platformMessageId: { $exists: true, $type: 'string', $ne: '' },
    },
  }
);

export const ConversationMessageModel =
  (mongoose.models.ConversationMessage as mongoose.Model<ConversationMessageDBModel>) ||
  mongoose.model<ConversationMessageDBModel>('ConversationMessage', conversationMessageSchema);
