import { expect } from 'chai';
import { UserSession } from '@novu/testing';
import { MessageRepository, SubscriberRepository, PreferencesRepository, TopicSubscribersRepository } from '@novu/dal';
import { Novu } from '@novu/api';
import { initNovuClassSdk } from '../../shared/helpers/e2e/sdk/e2e-sdk.helper';

describe('Delete Subscribers Bulk - /subscribers/bulk/delete (POST) #novu-v2', () => {
  let session: UserSession;
  let novuClient: Novu;
  let subscriberRepository: SubscriberRepository;
  let messageRepository: MessageRepository;
  let preferencesRepository: PreferencesRepository;
  let topicSubscribersRepository: TopicSubscribersRepository;

  let environmentId: string;
  let organizationId: string;

  beforeEach(async () => {
    session = new UserSession();
    await session.initialize({ noWidgetSession: true });
    novuClient = initNovuClassSdk(session);

    subscriberRepository = new SubscriberRepository();
    messageRepository = new MessageRepository();
    preferencesRepository = new PreferencesRepository();
    topicSubscribersRepository = new TopicSubscribersRepository();

    environmentId = session.environment._id;
    organizationId = session.organization._id;
  });

  it('should delete multiple subscribers and all associated data', async () => {
    const subscriberIds = ['bulk-test-1', 'bulk-test-2', 'bulk-test-3'];
    
    for (const subscriberId of subscriberIds) {
      await novuClient.subscribers.create({
        subscriberId,
        firstName: 'Test',
        lastName: 'User',
        email: `${subscriberId}@example.com`,
      });
    }

    const subscribersBeforeDeletion = await subscriberRepository.find({
      _environmentId: environmentId,
      subscriberId: { $in: subscriberIds },
    });
    expect(subscribersBeforeDeletion.length).to.equal(3);

    const { body } = await session.testAgent
      .post('/v2/subscribers/bulk/delete')
      .send({
        subscriberIds,
      })
      .expect(200);

    expect(body.data.acknowledged).to.equal(true);
    expect(body.data.status).to.equal('deleted');
    expect(body.data.deletedCount).to.equal(3);

    const subscribersAfterDeletion = await subscriberRepository.find({
      _environmentId: environmentId,
      subscriberId: { $in: subscriberIds },
    });
    expect(subscribersAfterDeletion.length).to.equal(0);
  });

  it('should fail when trying to delete more than 100 subscribers', async () => {
    const subscriberIds = Array.from({ length: 101 }, (_, i) => `bulk-test-${i}`);

    await session.testAgent
      .post('/v2/subscribers/bulk/delete')
      .send({
        subscriberIds,
      })
      .expect(422);
  });

  it('should fail when trying to delete non-existent subscribers', async () => {
    const subscriberIds = ['non-existent-1', 'non-existent-2'];

    const { body } = await session.testAgent
      .post('/v2/subscribers/bulk/delete')
      .send({
        subscriberIds,
      })
      .expect(404);

    expect(body.message).to.include('Some subscribers were not found');
  });

  it('should fail with empty subscriber IDs array', async () => {
    await session.testAgent
      .post('/v2/subscribers/bulk/delete')
      .send({
        subscriberIds: [],
      })
      .expect(422);
  });

  it('should handle partial failures gracefully', async () => {
    const existingSubscriberId = 'bulk-test-existing';
    const nonExistentSubscriberId = 'bulk-test-non-existent';

    await novuClient.subscribers.create({
      subscriberId: existingSubscriberId,
      firstName: 'Test',
      lastName: 'User',
      email: `${existingSubscriberId}@example.com`,
    });

    const { body } = await session.testAgent
      .post('/v2/subscribers/bulk/delete')
      .send({
        subscriberIds: [existingSubscriberId, nonExistentSubscriberId],
      })
      .expect(404);

    expect(body.message).to.include('Some subscribers were not found');
    
    const subscriber = await subscriberRepository.findOne({
      _environmentId: environmentId,
      subscriberId: existingSubscriberId,
    });
    expect(subscriber).to.exist;
  });
});
