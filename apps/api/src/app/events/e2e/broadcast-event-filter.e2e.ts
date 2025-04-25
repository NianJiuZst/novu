import { SubscriberEntity, SubscriberRepository } from '@novu/dal';
import { UserSession } from '@novu/testing';
import { expect } from 'chai';
import axios from 'axios';
import { StepTypeEnum } from '@novu/shared';

describe('Broadcast Event Filter - /events/trigger/broadcast (POST) #novu-v2', async () => {
  let session: UserSession;
  const subscriberRepository = new SubscriberRepository();

  beforeEach(async () => {
    session = new UserSession();
    await session.initialize();
  });

  it('should trigger only to subscribers matching the filter', async () => {
    // Create 5 subscribers with different data
    const subscriberIds: string[] = [];

    // Create first subscriber with country=USA
    await axios.post(
      `${session.serverUrl}/v1/subscribers`,
      {
        subscriberId: 'subscriber-usa-1',
        firstName: 'Subscriber',
        lastName: 'USA 1',
        email: 'usa1@example.com',
        data: {
          country: 'USA',
          plan: 'premium',
        },
      },
      {
        headers: {
          authorization: `ApiKey ${session.apiKey}`,
        },
      }
    );
    subscriberIds.push('subscriber-usa-1');

    // Create second subscriber with country=USA
    await axios.post(
      `${session.serverUrl}/v1/subscribers`,
      {
        subscriberId: 'subscriber-usa-2',
        firstName: 'Subscriber',
        lastName: 'USA 2',
        email: 'usa2@example.com',
        data: {
          country: 'USA',
          plan: 'basic',
        },
      },
      {
        headers: {
          authorization: `ApiKey ${session.apiKey}`,
        },
      }
    );
    subscriberIds.push('subscriber-usa-2');

    // Create third subscriber with country=Canada
    await axios.post(
      `${session.serverUrl}/v1/subscribers`,
      {
        subscriberId: 'subscriber-canada-1',
        firstName: 'Subscriber',
        lastName: 'Canada 1',
        email: 'canada1@example.com',
        data: {
          country: 'Canada',
          plan: 'premium',
        },
      },
      {
        headers: {
          authorization: `ApiKey ${session.apiKey}`,
        },
      }
    );
    subscriberIds.push('subscriber-canada-1');

    // Create a template for testing broadcasts
    const templateResponse = await session.createTemplate({
      steps: [
        {
          type: StepTypeEnum.IN_APP,
          content: 'Test broadcast notification {{country}}',
        },
      ],
    });

    // Trigger a broadcast with a filter for USA subscribers
    const response = await axios.post(
      `${session.serverUrl}/v1/events/trigger/broadcast`,
      {
        name: templateResponse.triggers[0].identifier,
        payload: {
          country: 'United States',
        },
        subscriberFilter: {
          'data.country': 'USA',
        },
      },
      {
        headers: {
          authorization: `ApiKey ${session.apiKey}`,
        },
      }
    );

    // eslint-disable-next-line no-console
    console.log('2222222', response.data.data);
    // eslint-disable-next-line no-console
    console.log('3333333', response.data.data.acknowledged);

    // Check response
    expect(response.data.data.acknowledged).to.be.true;
    expect(response.data.data.status).to.equal('processed');
    expect(response.data.data.transactionId).to.exist;

    // Wait for messages to be processed
    await session.waitForSubscriberQueueCompletion();
    await session.waitForStandardQueueCompletion();
    await session.waitForWorkflowQueueCompletion();

    // Get subscribers' notifications
    const usaSubscriber1 = await getSubscriber('subscriber-usa-1');
    const usaSubscriber2 = await getSubscriber('subscriber-usa-2');
    const canadaSubscriber = await getSubscriber('subscriber-canada-1');

    // Get the subscribers' notification feeds
    const usaSubscriber1NotificationResponse = await axios.get(
      `${session.serverUrl}/v1/subscribers/${usaSubscriber1._id}/notifications/feed`,
      {
        headers: {
          authorization: `ApiKey ${session.apiKey}`,
        },
      }
    );

    const usaSubscriber2NotificationResponse = await axios.get(
      `${session.serverUrl}/v1/subscribers/${usaSubscriber2._id}/notifications/feed`,
      {
        headers: {
          authorization: `ApiKey ${session.apiKey}`,
        },
      }
    );

    const canadaSubscriberNotificationResponse = await axios.get(
      `${session.serverUrl}/v1/subscribers/${canadaSubscriber._id}/notifications/feed`,
      {
        headers: {
          authorization: `ApiKey ${session.apiKey}`,
        },
      }
    );

    // USA subscribers should have notifications
    expect(usaSubscriber1NotificationResponse.data.data.length).to.be.greaterThan(0);
    expect(usaSubscriber2NotificationResponse.data.data.length).to.be.greaterThan(0);

    // Canada subscriber should not have notifications
    expect(canadaSubscriberNotificationResponse.data.data.length).to.equal(0);
  });

  it('should filter subscribers by complex query', async () => {
    // Create 5 subscribers with different data
    const subscriberIds: string[] = [];

    // Create premium USA subscriber
    await axios.post(
      `${session.serverUrl}/v1/subscribers`,
      {
        subscriberId: 'premium-usa',
        firstName: 'Premium',
        lastName: 'USA',
        email: 'premium-usa@example.com',
        data: {
          country: 'USA',
          plan: 'premium',
          accountCreated: '2022-01-01',
        },
      },
      {
        headers: {
          authorization: `ApiKey ${session.apiKey}`,
        },
      }
    );
    subscriberIds.push('premium-usa');

    // Create premium Canada subscriber
    await axios.post(
      `${session.serverUrl}/v1/subscribers`,
      {
        subscriberId: 'premium-canada',
        firstName: 'Premium',
        lastName: 'Canada',
        email: 'premium-canada@example.com',
        data: {
          country: 'Canada',
          plan: 'premium',
          accountCreated: '2022-02-01',
        },
      },
      {
        headers: {
          authorization: `ApiKey ${session.apiKey}`,
        },
      }
    );
    subscriberIds.push('premium-canada');

    // Create basic USA subscriber
    await axios.post(
      `${session.serverUrl}/v1/subscribers`,
      {
        subscriberId: 'basic-usa',
        firstName: 'Basic',
        lastName: 'USA',
        email: 'basic-usa@example.com',
        data: {
          country: 'USA',
          plan: 'basic',
          accountCreated: '2023-01-01',
        },
      },
      {
        headers: {
          authorization: `ApiKey ${session.apiKey}`,
        },
      }
    );
    subscriberIds.push('basic-usa');

    // Create a template for testing broadcasts
    const templateResponse = await session.createTemplate({
      steps: [
        {
          type: StepTypeEnum.IN_APP,
          content: 'Test broadcast with complex filter',
        },
      ],
    });

    // Trigger a broadcast with a complex filter (premium plan subscribers)
    const response = await axios.post(
      `${session.serverUrl}/v1/events/trigger/broadcast`,
      {
        name: templateResponse.triggers[0].identifier,
        payload: {
          message: 'Premium subscribers notification',
        },
        subscriberFilter: {
          'data.plan': 'premium',
        },
      },
      {
        headers: {
          authorization: `ApiKey ${session.apiKey}`,
        },
      }
    );

    // Check response
    expect(response.data.data.acknowledged).to.be.true;
    expect(response.data.data.status).to.equal('processed');
    expect(response.data.data.transactionId).to.exist;

    // Wait for messages to be processed
    await session.waitForSubscriberQueueCompletion();
    await session.waitForStandardQueueCompletion();
    await session.waitForWorkflowQueueCompletion();

    // Get subscribers' notifications
    const premiumUsaSubscriber = await getSubscriber('premium-usa');
    const premiumCanadaSubscriber = await getSubscriber('premium-canada');
    const basicUsaSubscriber = await getSubscriber('basic-usa');

    // Get the subscribers' notification feeds
    const premiumUsaNotificationResponse = await axios.get(
      `${session.serverUrl}/v1/subscribers/${premiumUsaSubscriber._id}/notifications/feed`,
      {
        headers: {
          authorization: `ApiKey ${session.apiKey}`,
        },
      }
    );

    const premiumCanadaNotificationResponse = await axios.get(
      `${session.serverUrl}/v1/subscribers/${premiumCanadaSubscriber._id}/notifications/feed`,
      {
        headers: {
          authorization: `ApiKey ${session.apiKey}`,
        },
      }
    );

    const basicUsaNotificationResponse = await axios.get(
      `${session.serverUrl}/v1/subscribers/${basicUsaSubscriber._id}/notifications/feed`,
      {
        headers: {
          authorization: `ApiKey ${session.apiKey}`,
        },
      }
    );

    // Premium subscribers should have notifications
    expect(premiumUsaNotificationResponse.data.data.length).to.be.greaterThan(0);
    expect(premiumCanadaNotificationResponse.data.data.length).to.be.greaterThan(0);

    // Basic subscriber should not have notifications
    expect(basicUsaNotificationResponse.data.data.length).to.equal(0);
  });

  async function getSubscriber(subscriberId: string): Promise<SubscriberEntity> {
    const subscriber = await subscriberRepository.findBySubscriberId(session.environment._id, subscriberId);
    if (!subscriber) {
      throw new Error(`Subscriber ${subscriberId} not found`);
    }

    return subscriber;
  }
});
