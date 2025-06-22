import mongoose, { Schema } from 'mongoose';
import { schemaOptions } from '../schema-default.options';
import { CustomNotificationDBModel } from './custom-notifications.entity';

const mongooseDelete = require('mongoose-delete');

const customNotificationsSchema = new Schema<CustomNotificationDBModel>(
  {
    _environmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Environment',
      required: true,
      index: true,
    },
    _organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    _subscriberId: {
      type: Schema.Types.ObjectId,
      ref: 'Subscriber',
      required: true,
      index: true,
    },
    query: {
      type: Schema.Types.String,
      required: true,
      minlength: 10,
      maxlength: 500,
    },
    enabled: {
      type: Schema.Types.Boolean,
      default: true,
    },
  },
  { ...schemaOptions, minimize: false }
);

customNotificationsSchema.plugin(mongooseDelete, { deletedAt: true, deletedBy: true, overrideMethods: 'all' });

// Index for finding custom notifications by subscriber
customNotificationsSchema.index({
  _environmentId: 1,
  _subscriberId: 1,
  enabled: 1,
});

// Index for finding all custom notifications in an environment
customNotificationsSchema.index({
  _environmentId: 1,
  _organizationId: 1,
  enabled: 1,
});

export const CustomNotification = mongoose.model<CustomNotificationDBModel>(
  'CustomNotification',
  customNotificationsSchema,
  'customnotifications'
);
