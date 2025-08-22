import { ChannelEndpointRoutingTypeEnum } from '@novu/shared';
import mongoose, { Schema } from 'mongoose';
import { schemaOptions } from '../schema-default.options';
import { ChannelEndpointDBModel } from './channel-endpoint.entity';

const routingSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: Object.values(ChannelEndpointRoutingTypeEnum),
    },
  },
  {
    _id: false,
    discriminatorKey: 'type',
  }
);

// Slack routing schema
const slackRoutingSchema = new Schema(
  {
    channelId: {
      type: String,
      required: false,
    },
    userId: {
      type: String,
      required: false,
    },
  },
  { _id: false }
);

routingSchema.discriminator(ChannelEndpointRoutingTypeEnum.SLACK, slackRoutingSchema);

const channelEndpointSchema = new Schema<ChannelEndpointDBModel>(
  {
    identifier: {
      type: Schema.Types.String,
      unique: true,
      required: true,
    },
    _organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
    },
    _environmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Environment',
    },
    _integrationId: {
      type: Schema.Types.ObjectId,
      ref: 'Integration',
    },
    subscriberId: Schema.Types.String,
    endpoint: Schema.Types.String,
    routing: {
      type: routingSchema,
      required: false,
    },
  },
  schemaOptions
);

export const ChannelEndpoint =
  (mongoose.models.ChannelEndpoint as mongoose.Model<ChannelEndpointDBModel>) ||
  mongoose.model<ChannelEndpointDBModel>('ChannelEndpoint', channelEndpointSchema);
