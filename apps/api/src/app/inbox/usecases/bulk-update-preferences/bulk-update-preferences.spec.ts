import { BadRequestException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { AnalyticsService, FeatureFlagsService, SendWebhookMessage } from '@novu/application-generic';
import {
  ContextRepository,
  EnvironmentRepository,
  NotificationTemplateRepository,
  PreferencesRepository,
  SubscriberRepository,
} from '@novu/dal';
import { PreferenceLevelEnum, PreferencesTypeEnum, TriggerTypeEnum } from '@novu/shared';
import { expect } from 'chai';
import sinon from 'sinon';
import { UpdatePreferences } from '../update-preferences/update-preferences.usecase';
import { BulkUpdatePreferencesCommand } from './bulk-update-preferences.command';
import { BulkUpdatePreferences } from './bulk-update-preferences.usecase';

const mockedSubscriber: any = {
  _id: '6447aff3d89122e250412c29',
  subscriberId: 'test-mockSubscriber',
  firstName: 'test',
  lastName: 'test',
};

const mockedWorkflow1: any = {
  _id: '6447aff3d89122e250412c28',
  name: 'test-workflow-1',
  critical: false,
  triggers: [{ identifier: 'test-trigger-1' }],
  tags: [],
  data: undefined,
  steps: [{ active: true, template: { type: 'email' } }],
  preferenceSettings: {},
};

const mockedWorkflow2: any = {
  _id: '6447aff3d89122e250412c30',
  name: 'test-workflow-2',
  critical: false,
  triggers: [{ identifier: 'test-trigger-2' }],
  tags: [],
  data: undefined,
  steps: [{ active: true, template: { type: 'in_app' } }],
  preferenceSettings: {},
};

const mockedInboxPreference1: any = {
  level: PreferenceLevelEnum.TEMPLATE,
  enabled: true,
  channels: {
    email: true,
    in_app: true,
    sms: false,
    push: false,
    chat: true,
  },
  workflow: {
    id: mockedWorkflow1._id,
    identifier: mockedWorkflow1.triggers[0].identifier,
    name: mockedWorkflow1.name,
    critical: mockedWorkflow1.critical,
    tags: mockedWorkflow1.tags,
    data: mockedWorkflow1.data,
  },
};

const mockedInboxPreference2: any = {
  level: PreferenceLevelEnum.TEMPLATE,
  enabled: true,
  channels: {
    email: false,
    in_app: true,
    sms: true,
    push: false,
    chat: true,
  },
  workflow: {
    id: mockedWorkflow2._id,
    identifier: mockedWorkflow2.triggers[0].identifier,
    name: mockedWorkflow2.name,
    critical: mockedWorkflow2.critical,
    tags: mockedWorkflow2.tags,
    data: mockedWorkflow2.data,
  },
};

describe('BulkUpdatePreferences', () => {
  let bulkUpdatePreferences: BulkUpdatePreferences;
  let subscriberRepositoryMock: sinon.SinonStubbedInstance<SubscriberRepository>;
  let analyticsServiceMock: sinon.SinonStubbedInstance<AnalyticsService>;
  let notificationTemplateRepositoryMock: sinon.SinonStubbedInstance<NotificationTemplateRepository>;
  let updatePreferencesUsecaseMock: sinon.SinonStubbedInstance<UpdatePreferences>;
  let environmentRepositoryMock: sinon.SinonStubbedInstance<EnvironmentRepository>;
  let contextRepositoryMock: sinon.SinonStubbedInstance<ContextRepository>;
  let featureFlagsServiceMock: sinon.SinonStubbedInstance<FeatureFlagsService>;
  let preferencesRepositoryMock: sinon.SinonStubbedInstance<PreferencesRepository>;
  let sendWebhookMessageMock: sinon.SinonStubbedInstance<SendWebhookMessage>;

  beforeEach(() => {
    subscriberRepositoryMock = sinon.createStubInstance(SubscriberRepository);
    analyticsServiceMock = sinon.createStubInstance(AnalyticsService);
    notificationTemplateRepositoryMock = sinon.createStubInstance(NotificationTemplateRepository);
    updatePreferencesUsecaseMock = sinon.createStubInstance(UpdatePreferences);
    environmentRepositoryMock = sinon.createStubInstance(EnvironmentRepository);
    contextRepositoryMock = sinon.createStubInstance(ContextRepository);
    featureFlagsServiceMock = sinon.createStubInstance(FeatureFlagsService);
    preferencesRepositoryMock = sinon.createStubInstance(PreferencesRepository);
    sendWebhookMessageMock = sinon.createStubInstance(SendWebhookMessage);

    bulkUpdatePreferences = new BulkUpdatePreferences(
      notificationTemplateRepositoryMock as any,
      subscriberRepositoryMock as any,
      analyticsServiceMock as any,
      updatePreferencesUsecaseMock as any,
      environmentRepositoryMock as any,
      contextRepositoryMock as any,
      featureFlagsServiceMock as any,
      preferencesRepositoryMock as any,
      sendWebhookMessageMock as any
    );
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should throw exception when subscriber is not found', async () => {
    const command = BulkUpdatePreferencesCommand.create({
      environmentId: 'env-1',
      organizationId: 'org-1',
      subscriberId: 'not-found',
      preferences: [
        {
          workflowId: mockedWorkflow1._id,
          in_app: true,
        },
      ],
    });

    subscriberRepositoryMock.findBySubscriberId.resolves(undefined);

    try {
      await bulkUpdatePreferences.execute(command);
      expect.fail('Should throw an exception');
    } catch (error) {
      expect(error).to.be.instanceOf(NotFoundException);
      expect(error.message).to.equal(`Subscriber with id: ${command.subscriberId} is not found`);
    }
  });

  it('should throw exception when no preferences are provided', async () => {
    const command = BulkUpdatePreferencesCommand.create({
      environmentId: 'env-1',
      organizationId: 'org-1',
      subscriberId: 'test-mockSubscriber',
      preferences: [],
    });

    subscriberRepositoryMock.findBySubscriberId.resolves(mockedSubscriber);

    try {
      await bulkUpdatePreferences.execute(command);
      expect.fail('Should throw an exception');
    } catch (error) {
      expect(error).to.be.instanceOf(BadRequestException);
      expect(error.message).to.equal('No preferences provided for bulk update');
    }
  });

  it('should throw exception when preferences exceed maximum limit', async () => {
    const preferences = Array(101).fill({
      workflowIdOrInternalId: mockedWorkflow1._id,
      in_app: true,
    });

    const command = BulkUpdatePreferencesCommand.create({
      environmentId: 'env-1',
      organizationId: 'org-1',
      subscriberId: 'test-mockSubscriber',
      preferences,
    });

    subscriberRepositoryMock.findBySubscriberId.resolves(mockedSubscriber);

    try {
      await bulkUpdatePreferences.execute(command);
      expect.fail('Should throw an exception');
    } catch (error) {
      expect(error).to.be.instanceOf(UnprocessableEntityException);
      expect(error.message).to.equal('preferences must contain no more than 100 elements');
    }
  });

  it('should correctly separate internal IDs from identifiers when querying workflows', async () => {
    const command = BulkUpdatePreferencesCommand.create({
      environmentId: 'env-1',
      organizationId: 'org-1',
      subscriberId: 'test-mockSubscriber',
      preferences: [
        {
          workflowId: mockedWorkflow1._id,
          in_app: true,
        },
        {
          workflowId: 'test-trigger-2',
          in_app: false,
        },
      ],
    });

    subscriberRepositoryMock.findBySubscriberId.resolves(mockedSubscriber);
    notificationTemplateRepositoryMock.findForBulkPreferences.resolves([mockedWorkflow1, mockedWorkflow2]);
    environmentRepositoryMock.findOne.resolves({ _id: 'env-1' } as any);
    featureFlagsServiceMock.getFlag.resolves(false);
    preferencesRepositoryMock.find.resolves([]);
    preferencesRepositoryMock.findOne.resolves(null);
    preferencesRepositoryMock.buildContextExactMatchQuery.returns({});
    preferencesRepositoryMock.bulkWrite.resolves({});
    sendWebhookMessageMock.execute.resolves();

    await bulkUpdatePreferences.execute(command);

    const findCallArgs = notificationTemplateRepositoryMock.findForBulkPreferences.firstCall.args;
    expect(findCallArgs[0]).to.equal('env-1');
    expect(findCallArgs[1]).to.deep.equal([mockedWorkflow1._id]);
    expect(findCallArgs[2]).to.deep.equal(['test-trigger-2']);
  });

  it('should handle mixed ID types correctly', async () => {
    const nonObjectIdString = 'simple-identifier-string';

    const command = BulkUpdatePreferencesCommand.create({
      environmentId: 'env-1',
      organizationId: 'org-1',
      subscriberId: 'test-mockSubscriber',
      preferences: [
        {
          workflowId: mockedWorkflow1._id,
          in_app: true,
        },
        {
          workflowId: nonObjectIdString,
          email: true,
        },
      ],
    });

    subscriberRepositoryMock.findBySubscriberId.resolves(mockedSubscriber);
    notificationTemplateRepositoryMock.findForBulkPreferences.resolves([
      mockedWorkflow1,
      { ...mockedWorkflow2, triggers: [{ type: TriggerTypeEnum.EVENT, identifier: nonObjectIdString }] },
    ]);
    environmentRepositoryMock.findOne.resolves({ _id: 'env-1' } as any);
    featureFlagsServiceMock.getFlag.resolves(false);
    preferencesRepositoryMock.find.resolves([]);
    preferencesRepositoryMock.findOne.resolves(null);
    preferencesRepositoryMock.buildContextExactMatchQuery.returns({});
    preferencesRepositoryMock.bulkWrite.resolves({});
    sendWebhookMessageMock.execute.resolves();

    await bulkUpdatePreferences.execute(command);

    const findCallArgs = notificationTemplateRepositoryMock.findForBulkPreferences.firstCall.args;
    expect(findCallArgs[1]).to.include(mockedWorkflow1._id);
    expect(findCallArgs[2]).to.include(nonObjectIdString);
  });

  it('should deduplicate preferences when different identifiers resolve to the same workflow', async () => {
    const internalId = mockedWorkflow1._id;
    const triggerIdentifier = mockedWorkflow1.triggers[0].identifier;

    const command = BulkUpdatePreferencesCommand.create({
      environmentId: 'env-1',
      organizationId: 'org-1',
      subscriberId: 'test-mockSubscriber',
      preferences: [
        {
          workflowId: internalId,
          in_app: true,
          email: false,
        },
        {
          workflowId: triggerIdentifier,
          in_app: false,
          email: true,
        },
      ],
    });

    subscriberRepositoryMock.findBySubscriberId.resolves(mockedSubscriber);
    notificationTemplateRepositoryMock.findForBulkPreferences.resolves([mockedWorkflow1]);
    environmentRepositoryMock.findOne.resolves({ _id: 'env-1' } as any);
    featureFlagsServiceMock.getFlag.resolves(false);
    preferencesRepositoryMock.find.resolves([]);
    preferencesRepositoryMock.findOne.resolves(null);
    preferencesRepositoryMock.buildContextExactMatchQuery.returns({});
    preferencesRepositoryMock.bulkWrite.resolves({});
    sendWebhookMessageMock.execute.resolves();

    const result = await bulkUpdatePreferences.execute(command);

    expect(preferencesRepositoryMock.bulkWrite.callCount).to.equal(1);
    const bulkOps = preferencesRepositoryMock.bulkWrite.firstCall.args[0];
    expect(bulkOps).to.have.lengthOf(1);

    expect(result.length).to.equal(1);
  });

  it('should throw exception when a workflow is not found', async () => {
    const command = BulkUpdatePreferencesCommand.create({
      environmentId: 'env-1',
      organizationId: 'org-1',
      subscriberId: 'test-mockSubscriber',
      preferences: [
        {
          workflowId: 'non-existent-id',
          in_app: true,
        },
      ],
    });

    subscriberRepositoryMock.findBySubscriberId.resolves(mockedSubscriber);
    notificationTemplateRepositoryMock.findForBulkPreferences.resolves([]);

    try {
      await bulkUpdatePreferences.execute(command);
      expect.fail('Should throw an exception');
    } catch (error) {
      expect(error).to.be.instanceOf(NotFoundException);
      expect(error.message).to.include('Workflows with ids: non-existent-id not found');
    }
  });

  it('should throw exception when a workflow is critical', async () => {
    const criticalWorkflow = { ...mockedWorkflow1, critical: true };

    const command = BulkUpdatePreferencesCommand.create({
      environmentId: 'env-1',
      organizationId: 'org-1',
      subscriberId: 'test-mockSubscriber',
      preferences: [
        {
          workflowId: criticalWorkflow._id,
          in_app: true,
        },
      ],
    });

    subscriberRepositoryMock.findBySubscriberId.resolves(mockedSubscriber);
    notificationTemplateRepositoryMock.findForBulkPreferences.resolves([criticalWorkflow]);

    try {
      await bulkUpdatePreferences.execute(command);
      expect.fail('Should throw an exception');
    } catch (error) {
      expect(error).to.be.instanceOf(BadRequestException);
      expect(error.message).to.include(`Critical workflows with ids: ${criticalWorkflow._id} cannot be updated`);
    }
  });

  it('should use bulkWrite to update multiple workflow preferences', async () => {
    const command = BulkUpdatePreferencesCommand.create({
      environmentId: 'env-1',
      organizationId: 'org-1',
      subscriberId: 'test-mockSubscriber',
      preferences: [
        {
          workflowId: mockedWorkflow1._id,
          in_app: true,
          email: false,
        },
        {
          workflowId: mockedWorkflow2._id,
          sms: true,
          chat: true,
        },
      ],
    });

    subscriberRepositoryMock.findBySubscriberId.resolves(mockedSubscriber);
    notificationTemplateRepositoryMock.findForBulkPreferences.resolves([mockedWorkflow1, mockedWorkflow2]);
    environmentRepositoryMock.findOne.resolves({ _id: 'env-1' } as any);
    featureFlagsServiceMock.getFlag.resolves(false);
    preferencesRepositoryMock.find.resolves([]);
    preferencesRepositoryMock.findOne.resolves(null);
    preferencesRepositoryMock.buildContextExactMatchQuery.returns({});
    preferencesRepositoryMock.bulkWrite.resolves({});
    sendWebhookMessageMock.execute.resolves();

    const result = await bulkUpdatePreferences.execute(command);

    expect(preferencesRepositoryMock.bulkWrite.callCount).to.equal(1);
    const bulkOps = preferencesRepositoryMock.bulkWrite.firstCall.args[0];
    expect(bulkOps).to.have.lengthOf(2);

    expect(result).to.have.lengthOf(2);
    expect(result[0].level).to.equal(PreferenceLevelEnum.TEMPLATE);
    expect(result[1].level).to.equal(PreferenceLevelEnum.TEMPLATE);
  });

  it('should merge with existing preferences when updating', async () => {
    const existingPref = {
      _id: 'existing-pref-id',
      _environmentId: 'env-1',
      _organizationId: 'org-1',
      _subscriberId: mockedSubscriber._id,
      _templateId: mockedWorkflow1._id,
      type: PreferencesTypeEnum.SUBSCRIBER_WORKFLOW,
      preferences: {
        channels: {
          email: { enabled: true },
          sms: { enabled: false },
        },
      },
    };

    const command = BulkUpdatePreferencesCommand.create({
      environmentId: 'env-1',
      organizationId: 'org-1',
      subscriberId: 'test-mockSubscriber',
      preferences: [
        {
          workflowId: mockedWorkflow1._id,
          email: false,
        },
      ],
    });

    subscriberRepositoryMock.findBySubscriberId.resolves(mockedSubscriber);
    notificationTemplateRepositoryMock.findForBulkPreferences.resolves([mockedWorkflow1]);
    environmentRepositoryMock.findOne.resolves({ _id: 'env-1' } as any);
    featureFlagsServiceMock.getFlag.resolves(false);
    preferencesRepositoryMock.find.onFirstCall().resolves([existingPref as any]);
    preferencesRepositoryMock.find.onSecondCall().resolves([]);
    preferencesRepositoryMock.findOne.resolves(null);
    preferencesRepositoryMock.buildContextExactMatchQuery.returns({});
    preferencesRepositoryMock.bulkWrite.resolves({});
    sendWebhookMessageMock.execute.resolves();

    await bulkUpdatePreferences.execute(command);

    expect(preferencesRepositoryMock.bulkWrite.callCount).to.equal(1);
    const bulkOps = preferencesRepositoryMock.bulkWrite.firstCall.args[0];
    expect(bulkOps[0].updateOne.filter).to.deep.include({ _id: 'existing-pref-id' });
    const setPrefs = bulkOps[0].updateOne.update.$set.preferences;
    expect(setPrefs.channels.email.enabled).to.equal(false);
    expect(setPrefs.channels.sms.enabled).to.equal(false);
  });

  it('should support lookup by workflow identifier', async () => {
    const command = BulkUpdatePreferencesCommand.create({
      environmentId: 'env-1',
      organizationId: 'org-1',
      subscriberId: 'test-mockSubscriber',
      preferences: [
        {
          workflowId: 'test-trigger-1',
          in_app: true,
        },
      ],
    });

    subscriberRepositoryMock.findBySubscriberId.resolves(mockedSubscriber);
    notificationTemplateRepositoryMock.findForBulkPreferences.resolves([mockedWorkflow1]);
    environmentRepositoryMock.findOne.resolves({ _id: 'env-1' } as any);
    featureFlagsServiceMock.getFlag.resolves(false);
    preferencesRepositoryMock.find.resolves([]);
    preferencesRepositoryMock.findOne.resolves(null);
    preferencesRepositoryMock.buildContextExactMatchQuery.returns({});
    preferencesRepositoryMock.bulkWrite.resolves({});
    sendWebhookMessageMock.execute.resolves();

    const result = await bulkUpdatePreferences.execute(command);

    expect(preferencesRepositoryMock.bulkWrite.callCount).to.equal(1);
    expect(result).to.have.lengthOf(1);
  });

  it('should fall back to per-item path when subscriptionIdentifier is present', async () => {
    const command = BulkUpdatePreferencesCommand.create({
      environmentId: 'env-1',
      organizationId: 'org-1',
      subscriberId: 'test-mockSubscriber',
      preferences: [
        {
          workflowId: mockedWorkflow1._id,
          in_app: true,
          subscriptionIdentifier: 'sub-123',
        },
      ],
    });

    subscriberRepositoryMock.findBySubscriberId.resolves(mockedSubscriber);
    notificationTemplateRepositoryMock.findForBulkPreferences.resolves([mockedWorkflow1]);
    environmentRepositoryMock.findOne.resolves({ _id: 'env-1' } as any);
    updatePreferencesUsecaseMock.execute.resolves(mockedInboxPreference1);

    const result = await bulkUpdatePreferences.execute(command);

    expect(updatePreferencesUsecaseMock.execute.callCount).to.equal(1);
    expect(preferencesRepositoryMock.bulkWrite.callCount).to.equal(0);
    expect(result).to.deep.equal([mockedInboxPreference1]);
  });

  it('should send webhook for each updated preference', async () => {
    const command = BulkUpdatePreferencesCommand.create({
      environmentId: 'env-1',
      organizationId: 'org-1',
      subscriberId: 'test-mockSubscriber',
      preferences: [
        {
          workflowId: mockedWorkflow1._id,
          email: false,
        },
        {
          workflowId: mockedWorkflow2._id,
          sms: true,
        },
      ],
    });

    subscriberRepositoryMock.findBySubscriberId.resolves(mockedSubscriber);
    notificationTemplateRepositoryMock.findForBulkPreferences.resolves([mockedWorkflow1, mockedWorkflow2]);
    environmentRepositoryMock.findOne.resolves({ _id: 'env-1' } as any);
    featureFlagsServiceMock.getFlag.resolves(false);
    preferencesRepositoryMock.find.resolves([]);
    preferencesRepositoryMock.findOne.resolves(null);
    preferencesRepositoryMock.buildContextExactMatchQuery.returns({});
    preferencesRepositoryMock.bulkWrite.resolves({});
    sendWebhookMessageMock.execute.resolves();

    await bulkUpdatePreferences.execute(command);

    expect(sendWebhookMessageMock.execute.callCount).to.equal(2);
  });
});
