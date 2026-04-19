import { DomainRouteTypeEnum, DomainStatusEnum } from '@novu/shared';
import mongoose, { Schema } from 'mongoose';

import { schemaOptions } from '../schema-default.options';
import { DomainDBModel } from './domain.entity';

const NOVU_DEMO_DOMAIN = process.env.MAIL_SERVER_DOMAIN?.replace('https://', '').replace('/', '');

const domainSchema = new Schema<DomainDBModel>(
  {
    name: {
      type: Schema.Types.String,
      required: true,
    },
    status: {
      type: Schema.Types.String,
      enum: Object.values(DomainStatusEnum),
      default: DomainStatusEnum.PENDING,
    },
    mxRecordConfigured: {
      type: Schema.Types.Boolean,
      default: false,
    },
    dnsProvider: {
      type: Schema.Types.String,
    },
    routes: [
      {
        address: { type: Schema.Types.String, required: true },
        destination: { type: Schema.Types.String, required: true },
        type: { type: Schema.Types.String, enum: Object.values(DomainRouteTypeEnum), required: true },
      },
    ],
    _organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
    },
    _environmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Environment',
    },
  },
  schemaOptions
);

/*
 * Custom domains are globally unique — a DNS name cannot be claimed by more
 * than one organisation. The demo/Novu domain is excluded so every org can
 * share it.
 *
 * Note: For self-hosted installations, there is no need to handle the demo domain index,
 * as the concept of a global demo/Novu domain is only relevant for cloud deployments.
 */
if (NOVU_DEMO_DOMAIN) {
  domainSchema.index({ name: 1 }, { unique: true, partialFilterExpression: { name: { $ne: NOVU_DEMO_DOMAIN } } });
  domainSchema.index(
    { name: 1, _organizationId: 1 },
    { unique: true, partialFilterExpression: { name: NOVU_DEMO_DOMAIN } }
  );
} else {
  domainSchema.index({ name: 1 }, { unique: true });
}

domainSchema.index({ _environmentId: 1 });

/*
 * Supports listDomains queries scoped to a specific environment + organization.
 */
domainSchema.index({ _environmentId: 1, _organizationId: 1 });

/*
 * Supports global route-address lookup (findByRouteAddress).
 */
domainSchema.index({ 'routes.address': 1 });

export const Domain =
  (mongoose.models.Domain as mongoose.Model<DomainDBModel>) || mongoose.model<DomainDBModel>('Domain', domainSchema);
