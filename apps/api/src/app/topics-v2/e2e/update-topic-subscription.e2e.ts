import { Novu } from '@novu/api';
import { ConditionType, SubscriberEntity, TopicSubscribersRepository } from '@novu/dal';
import { SubscribersService, UserSession } from '@novu/testing';
import { expect } from 'chai';
import { initNovuClassSdk } from '../../shared/helpers/e2e/sdk/e2e-sdk.helper';

describe('Update topic subscription - /v2/topics/:topicKey/subscriptions/:subscriptionId (PATCH) #novu-v2', async () => {
  let session: UserSession;
  let novuClient: Novu;
  let subscriber1: SubscriberEntity;
  let subscriber2: SubscriberEntity;
  let topicSubscribersRepository: TopicSubscribersRepository;

  before(async () => {
    session = new UserSession();
    await session.initialize();
    novuClient = initNovuClassSdk(session);
    topicSubscribersRepository = new TopicSubscribersRepository();

    const subscribersService = new SubscribersService(session.organization._id, session.environment._id);
    subscriber1 = await subscribersService.createSubscriber();
    subscriber2 = await subscribersService.createSubscriber();
  });

  it('should update subscription rules', async () => {
    const topicKey = `topic-key-update-${Date.now()}`;

    await novuClient.topics.create({
      key: topicKey,
      name: 'Test Topic',
    });

    const subscriptionResponse = await novuClient.topics.subscriptions.create(
      {
        subscriberIds: [subscriber1.subscriberId],
        rules: [
          {
            filter: { workflows: ['workflow-1'], tags: ['tag1'] },
            type: ConditionType.CHECKBOX,
            condition: true,
          },
        ],
      },
      topicKey
    );

    expect(subscriptionResponse.result.data.length).to.equal(1);
    const subscriptionId = subscriptionResponse.result.data[0].id;

    const updateResponse = await novuClient.topics.subscriptions.update({
      topicKey,
      subscriptionId,
      updateTopicSubscriptionRequestDto: {
        rules: [
          {
            filter: { workflows: ['workflow-2'], tags: ['tag2'] },
            type: ConditionType.CHECKBOX,
            condition: false,
          },
        ],
      },
    });

    expect(updateResponse).to.exist;
    expect(updateResponse.result.id).to.equal(subscriptionId);
    expect(updateResponse.result.rules).to.exist;
    expect(updateResponse.result.rules?.length).to.equal(1);
    expect(updateResponse.result.rules?.[0]?.filter.workflows).to.include('workflow-2');
    expect(updateResponse.result.rules?.[0]?.filter.tags).to.include('tag2');
    expect(updateResponse.result.rules?.[0]?.condition).to.equal(false);

    const subscription = await topicSubscribersRepository.findOne({
      _id: subscriptionId,
      _environmentId: session.environment._id,
      _organizationId: session.organization._id,
    });

    expect(subscription).to.exist;
    expect(subscription?.rules?.length).to.equal(1);
    expect(subscription?.rules?.[0]?.filter.workflows).to.include('workflow-2');
  });

  it('should update subscription with multiple rules', async () => {
    const topicKey = `topic-key-multiple-rules-${Date.now()}`;

    await novuClient.topics.create({
      key: topicKey,
      name: 'Test Topic',
    });

    const subscriptionResponse = await novuClient.topics.subscriptions.create(
      {
        subscriberIds: [subscriber2.subscriberId],
        rules: [
          {
            filter: { workflows: ['workflow-1'], tags: ['tag1'] },
            type: ConditionType.CHECKBOX,
            condition: true,
          },
        ],
      },
      topicKey
    );

    const subscriptionId = subscriptionResponse.result.data[0].id;

    const updateResponse = await novuClient.topics.subscriptions.update({
      topicKey,
      subscriptionId,
      updateTopicSubscriptionRequestDto: {
        rules: [
          {
            filter: { workflows: ['workflow-2'], tags: ['tag2'] },
            type: ConditionType.CUSTOM,
            condition: { and: [{ '==': [{ var: 'status' }, 'active'] }] },
          },
          {
            filter: { tags: ['tag3'] },
            type: ConditionType.CHECKBOX,
            condition: false,
          },
        ],
      },
    });

    expect(updateResponse).to.exist;
    expect(updateResponse.result.id).to.equal(subscriptionId);
    expect(updateResponse.result.rules).to.exist;
    expect(updateResponse.result.rules?.length).to.equal(2);
  });

  it('should return 404 when subscription does not exist', async () => {
    const topicKey = `topic-key-404-${Date.now()}`;

    await novuClient.topics.create({
      key: topicKey,
      name: 'Test Topic',
    });

    const nonExistentSubscriptionId = '507f1f77bcf86cd799439011';

    try {
      await novuClient.topics.subscriptions.update({
        topicKey,
        subscriptionId: nonExistentSubscriptionId,
        updateTopicSubscriptionRequestDto: {
          rules: [
            {
              filter: { workflows: ['workflow-1'] },
              type: ConditionType.CHECKBOX,
              condition: true,
            },
          ],
        },
      });
      expect.fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.statusCode || error.status).to.equal(404);
    }
  });

  it('should return 404 when topic does not exist', async () => {
    const nonExistentTopicKey = `non-existent-topic-${Date.now()}`;
    const nonExistentSubscriptionId = '507f1f77bcf86cd799439011';

    try {
      await novuClient.topics.subscriptions.update({
        topicKey: nonExistentTopicKey,
        subscriptionId: nonExistentSubscriptionId,
        updateTopicSubscriptionRequestDto: {
          rules: [
            {
              filter: { workflows: ['workflow-1'] },
              type: ConditionType.CHECKBOX,
              condition: true,
            },
          ],
        },
      });
      expect.fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.statusCode || error.status).to.equal(404);
    }
  });

  it('should handle empty update request', async () => {
    const topicKey = `topic-key-empty-${Date.now()}`;

    await novuClient.topics.create({
      key: topicKey,
      name: 'Test Topic',
    });

    const subscriptionResponse = await novuClient.topics.subscriptions.create(
      {
        subscriberIds: [subscriber1.subscriberId],
        rules: [
          {
            filter: { workflows: ['workflow-1'] },
            type: ConditionType.CHECKBOX,
            condition: true,
          },
        ],
      },
      topicKey
    );

    const subscriptionId = subscriptionResponse.result.data[0].id;

    const updateResponse = await novuClient.topics.subscriptions.update({
      topicKey,
      subscriptionId,
      updateTopicSubscriptionRequestDto: {},
    });

    expect(updateResponse).to.exist;
    expect(updateResponse.result.id).to.equal(subscriptionId);
  });

  it('should update subscription with custom condition rules', async () => {
    const topicKey = `topic-key-custom-${Date.now()}`;

    await novuClient.topics.create({
      key: topicKey,
      name: 'Test Topic',
    });

    const subscriptionResponse = await novuClient.topics.subscriptions.create(
      {
        subscriberIds: [subscriber1.subscriberId],
      },
      topicKey
    );

    const subscriptionId = subscriptionResponse.result.data[0].id;

    const customCondition = {
      and: [{ '==': [{ var: 'priority' }, 'high'] }, { '>': [{ var: 'amount' }, 100] }],
    };

    const updateResponse = await novuClient.topics.subscriptions.update({
      topicKey,
      subscriptionId,
      updateTopicSubscriptionRequestDto: {
        rules: [
          {
            filter: { workflows: ['workflow-1'], tags: ['important'] },
            type: ConditionType.CUSTOM,
            condition: customCondition,
          },
        ],
      },
    });

    expect(updateResponse).to.exist;
    expect(updateResponse.result.id).to.equal(subscriptionId);
    expect(updateResponse.result.rules).to.exist;
    expect(updateResponse.result.rules?.length).to.equal(1);
    expect(updateResponse.result.rules?.[0]?.type).to.equal(ConditionType.CUSTOM);
  });
});
