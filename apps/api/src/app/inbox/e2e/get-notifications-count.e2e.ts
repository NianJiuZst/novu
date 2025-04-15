import { expect } from 'chai';
import { UserSession } from '@novu/testing';
import {
  MessageRepository,
  NotificationTemplateEntity,
  SubscriberEntity,
  SubscriberRepository,
  CommunityOrganizationRepository,
  OrganizationRepository,
} from '@novu/dal';
import {
  ActorTypeEnum,
  ApiServiceLevelEnum,
  ChannelCTATypeEnum,
  ChannelTypeEnum,
  StepTypeEnum,
  SystemAvatarIconEnum,
  TemplateVariableTypeEnum,
} from '@novu/shared';
import { Novu } from '@novu/api';
import { subHours } from 'date-fns';
import { initNovuClassSdk } from '../../shared/helpers/e2e/sdk/e2e-sdk.helper';

describe('Get Notifications Count - /inbox/notifications/count (GET) #novu-v2', async () => {
  let session: UserSession;
  let template: NotificationTemplateEntity;
  let subscriber: SubscriberEntity | null;
  const messageRepository = new MessageRepository();
  const subscriberRepository = new SubscriberRepository();
  const communityOrganizationRepository = new CommunityOrganizationRepository();

  let novuClient: Novu;
  beforeEach(async () => {
    session = new UserSession();
    await session.initialize();
    novuClient = initNovuClassSdk(session);
    subscriber = await subscriberRepository.findBySubscriberId(session.environment._id, session.subscriberId);
    template = await session.createTemplate({
      noFeedId: true,
      steps: [
        {
          type: StepTypeEnum.IN_APP,
          content: 'Test content for <b>{{firstName}}</b>',
          cta: {
            type: ChannelCTATypeEnum.REDIRECT,
            data: {
              url: '/cypress/test-shell/example/test?test-param=true',
            },
          },
          variables: [
            {
              defaultValue: '',
              name: 'firstName',
              required: false,
              type: TemplateVariableTypeEnum.STRING,
            },
          ],
          actor: {
            type: ActorTypeEnum.SYSTEM_ICON,
            data: SystemAvatarIconEnum.WARNING,
          },
        },
      ],
    });
  });

  const getNotificationsCount = async (filters: Array<{ tags?: string[]; read?: boolean; archived?: boolean }>) => {
    return await session.testAgent
      .get(`/v1/inbox/notifications/count?filters=${JSON.stringify(filters)}`)
      .set('Authorization', `Bearer ${session.subscriberToken}`);
  };

  const triggerEvent = async (templateToTrigger: NotificationTemplateEntity, times = 1) => {
    const promises: Array<Promise<unknown>> = [];
    for (let i = 0; i < times; i += 1) {
      promises.push(
        novuClient.trigger({
          workflowId: templateToTrigger.triggers[0].identifier,
          to: { subscriberId: session.subscriberId },
        })
      );
    }

    await Promise.all(promises);
    await session.waitForJobCompletion(templateToTrigger._id);
  };

  it('should throw exception when filtering for unread and archived notifications', async function () {
    await triggerEvent(template);

    const { body, status } = await getNotificationsCount([{ read: false, archived: true }]);

    expect(status).to.equal(400);
    expect(body.message).to.equal('Filtering for unread and archived notifications is not supported.');
  });

  it('should return all notifications count', async function () {
    const count = 4;
    await triggerEvent(template, count);
    const { body, status } = await getNotificationsCount([{}]);

    expect(status).to.equal(200);
    expect(body.data).to.be.ok;
    expect(body.data.length).to.eq(1);
    expect(body.data[0].count).to.eq(count);
    expect(body.data[0].filter).to.deep.equal({});
  });

  it('should return notifications count for specified tags', async function () {
    const count = 4;
    const tags = ['hello'];
    const templateWithTags = await session.createTemplate({
      noFeedId: true,
      tags,
      steps: [
        {
          type: StepTypeEnum.IN_APP,
          content: 'Test content for newsletter',
          actor: {
            type: ActorTypeEnum.SYSTEM_ICON,
            data: SystemAvatarIconEnum.WARNING,
          },
        },
      ],
    });
    await triggerEvent(template, 2);
    await triggerEvent(templateWithTags, count);

    const { body, status } = await getNotificationsCount([{ tags }]);

    expect(status).to.equal(200);
    expect(body.data).to.be.ok;
    expect(body.data.length).to.eq(1);
    expect(body.data[0].count).to.eq(count);
    expect(body.data[0].filter).to.deep.equal({
      tags,
    });
  });

  it('should return notifications count for read notifications', async function () {
    const count = 4;
    await triggerEvent(template, count);
    await messageRepository.update(
      {
        _environmentId: session.environment._id,
        _subscriberId: subscriber?._id ?? '',
        channel: ChannelTypeEnum.IN_APP,
      },
      { $set: { read: true } }
    );

    const { body, status } = await getNotificationsCount([{ read: true }]);

    expect(status).to.equal(200);
    expect(body.data).to.be.ok;
    expect(body.data.length).to.eq(1);
    expect(body.data[0].count).to.eq(count);
    expect(body.data[0].filter).to.deep.equal({
      read: true,
    });
  });

  it('should return notifications count for archived notifications', async function () {
    const count = 4;
    await triggerEvent(template, count);
    await messageRepository.update(
      {
        _environmentId: session.environment._id,
        _subscriberId: subscriber?._id ?? '',
        channel: ChannelTypeEnum.IN_APP,
      },
      { $set: { archived: true } }
    );

    const { body, status } = await getNotificationsCount([{ archived: true }]);

    expect(status).to.equal(200);
    expect(body.data).to.be.ok;
    expect(body.data.length).to.eq(1);
    expect(body.data[0].count).to.eq(count);
    expect(body.data[0].filter).to.deep.equal({
      archived: true,
    });
  });

  it('should return notifications count for read and archived notifications', async function () {
    const count = 2;
    await triggerEvent(template, count);
    await messageRepository.update(
      {
        _environmentId: session.environment._id,
        _subscriberId: subscriber?._id ?? '',
        channel: ChannelTypeEnum.IN_APP,
      },
      { $set: { read: true, archived: true } }
    );

    const { body, status } = await getNotificationsCount([{ read: true, archived: true }]);

    expect(status).to.equal(200);
    expect(body.data).to.be.ok;
    expect(body.data.length).to.eq(1);
    expect(body.data[0].count).to.eq(count);
    expect(body.data[0].filter).to.deep.equal({
      read: true,
      archived: true,
    });
  });

  it('should return read notifications count for specified tags', async function () {
    const count = 4;
    const tags = ['hello'];
    const templateWithTags = await session.createTemplate({
      noFeedId: true,
      tags,
      steps: [
        {
          type: StepTypeEnum.IN_APP,
          content: 'Test content for newsletter',
          actor: {
            type: ActorTypeEnum.SYSTEM_ICON,
            data: SystemAvatarIconEnum.WARNING,
          },
        },
      ],
    });
    await triggerEvent(template, 2);
    await triggerEvent(templateWithTags, count);

    await messageRepository.update(
      {
        _environmentId: session.environment._id,
        _subscriberId: subscriber?._id ?? '',
        channel: ChannelTypeEnum.IN_APP,
        tags: { $in: tags },
      },
      { $set: { read: true } }
    );

    const { body, status } = await getNotificationsCount([{ tags, read: true }]);

    expect(status).to.equal(200);
    expect(body.data).to.be.ok;
    expect(body.data.length).to.eq(1);
    expect(body.data[0].count).to.eq(count);
    expect(body.data[0].filter).to.deep.equal({
      tags,
      read: true,
    });
  });

  it('should return notification counts for multiple filters', async function () {
    const count = 4;
    const tags = ['hello'];
    const templateWithTags = await session.createTemplate({
      noFeedId: true,
      tags,
      steps: [
        {
          type: StepTypeEnum.IN_APP,
          content: 'Test content for newsletter',
          actor: {
            type: ActorTypeEnum.SYSTEM_ICON,
            data: SystemAvatarIconEnum.WARNING,
          },
        },
      ],
    });
    await triggerEvent(template, 2);
    await triggerEvent(templateWithTags, count);

    const { body, status } = await getNotificationsCount([{ tags }, { read: false }]);

    expect(status).to.equal(200);
    expect(body.data).to.be.ok;
    expect(body.data.length).to.eq(2);
    expect(body.data[0].count).to.eq(count);
    expect(body.data[0].filter).to.deep.equal({
      tags,
    });
    expect(body.data[1].count).to.eq(6);
    expect(body.data[1].filter).to.deep.equal({ read: false });
  });

  describe('Notifications Count by apiServiceLevel retention periods', () => {
    beforeEach(async () => {});

    it('should respect free tier retention period (24+3 hours)', async function () {
      const freeTemplate = await session.createTemplate({
        noFeedId: true,
        steps: [
          {
            type: StepTypeEnum.IN_APP,
            content: 'Test content for free tier',
            actor: {
              type: ActorTypeEnum.SYSTEM_ICON,
              data: SystemAvatarIconEnum.WARNING,
            },
          },
        ],
      });

      const now = new Date();
      const withinRetention = subHours(now, 20); // Within 24+3 hours
      const outsideRetention = subHours(now, 30); // Outside 24+3 hours

      await communityOrganizationRepository.update(
        { _id: session.organization._id },
        { apiServiceLevel: ApiServiceLevelEnum.FREE }
      );

      await createMessagesWithDates(session, [withinRetention, outsideRetention], freeTemplate, subscriberRepository);

      const { body, status } = await getNotificationsCount([{}]);

      // eslint-disable-next-line no-console
      console.log('body.data 333 ', body.data);

      expect(status).to.equal(200);
      expect(body.data).to.be.ok;
      expect(body.data.length).to.eq(1);
      expect(body.data[0].count).to.eq(1);
    });

    it('should respect pro tier retention period (7+3 days)', async function () {
      const proTemplate = await session.createTemplate({
        noFeedId: true,
        steps: [
          {
            type: StepTypeEnum.IN_APP,
            content: 'Test content for pro tier',
            actor: {
              type: ActorTypeEnum.SYSTEM_ICON,
              data: SystemAvatarIconEnum.WARNING,
            },
          },
        ],
      });

      const now = new Date();
      const withinRetention = subHours(now, 5 * 24); // Within 7+3 days
      const outsideRetention = subHours(now, 12 * 24); // Outside 7+3 days

      await communityOrganizationRepository.update(
        { _id: session.organization._id },
        { apiServiceLevel: ApiServiceLevelEnum.PRO }
      );

      await createMessagesWithDates(session, [withinRetention, outsideRetention], proTemplate, subscriberRepository);

      const { body, status } = await getNotificationsCount([{}]);

      expect(status).to.equal(200);
      expect(body.data).to.be.ok;
      expect(body.data.length).to.eq(1);
      expect(body.data[0].count).to.eq(1);
    });

    it('should respect business tier retention period (90+3 days)', async function () {
      const businessTemplate = await session.createTemplate({
        noFeedId: true,
        steps: [
          {
            type: StepTypeEnum.IN_APP,
            content: 'Test content for business tier',
            actor: {
              type: ActorTypeEnum.SYSTEM_ICON,
              data: SystemAvatarIconEnum.WARNING,
            },
          },
        ],
      });

      const now = new Date();
      const withinRetention = subHours(now, 60 * 24); // Within 90+3 days
      const outsideRetention = subHours(now, 100 * 24); // Outside 90+3 days

      await communityOrganizationRepository.update(
        { _id: session.organization._id },
        { apiServiceLevel: ApiServiceLevelEnum.BUSINESS }
      );

      await createMessagesWithDates(
        session,
        [withinRetention, outsideRetention],
        businessTemplate,
        subscriberRepository
      );

      const { body, status } = await getNotificationsCount([{}]);

      expect(status).to.equal(200);
      expect(body.data).to.be.ok;
      expect(body.data.length).to.eq(1);
      expect(body.data[0].count).to.eq(1);
    });

    it('should respect legacy free tier retention period (30+3 days)', async function () {
      const legacyFreeTemplate = await session.createTemplate({
        noFeedId: true,
        steps: [
          {
            type: StepTypeEnum.IN_APP,
            content: 'Test content for legacy free tier',
            actor: {
              type: ActorTypeEnum.SYSTEM_ICON,
              data: SystemAvatarIconEnum.WARNING,
            },
          },
        ],
      });

      const now = new Date();
      const withinRetention = subHours(now, 25 * 24); // Within 30+3 days
      const outsideRetention = subHours(now, 40 * 24); // Outside 30+3 days

      await communityOrganizationRepository.update(
        { _id: session.organization._id },
        { apiServiceLevel: ApiServiceLevelEnum.FREE, createdAt: new Date('2024-01-28') }
      );

      await createMessagesWithDates(
        session,
        [withinRetention, outsideRetention],
        legacyFreeTemplate,
        subscriberRepository
      );

      const { body, status } = await getNotificationsCount([{}]);

      expect(status).to.equal(200);
      expect(body.data).to.be.ok;
      expect(body.data.length).to.eq(1);
      expect(body.data[0].count).to.eq(1);
    });

    it('should use fallback retention period for unknown apiServiceLevel', async function () {
      const unknownSession = new UserSession();
      await unknownSession.initialize();

      const communityOrganizationRepository = new CommunityOrganizationRepository();
      await communityOrganizationRepository.update(
        { _id: unknownSession.organization._id },
        { apiServiceLevel: 'unknown' as any }
      );

      const unknownTemplate = await unknownSession.createTemplate({
        noFeedId: true,
        steps: [
          {
            type: StepTypeEnum.IN_APP,
            content: 'Test content for unknown tier',
            actor: {
              type: ActorTypeEnum.SYSTEM_ICON,
              data: SystemAvatarIconEnum.WARNING,
            },
          },
        ],
      });

      const now = new Date();
      const withinRetention = subHours(now, 80 * 24); // Within fallback retention (93 days)
      const outsideRetention = subHours(now, 100 * 24); // Outside fallback retention

      await communityOrganizationRepository.update(
        { _id: unknownSession.organization._id },
        { apiServiceLevel: undefined }
      );

      await createMessagesWithDates(
        unknownSession,
        [withinRetention, outsideRetention],
        unknownTemplate,
        subscriberRepository
      );

      const { body, status } = await getNotificationsCount([{}]);

      expect(status).to.equal(200);
      expect(body.data).to.be.ok;
      expect(body.data.length).to.eq(1);
      expect(body.data[0].count).to.eq(1);
    });

    it('should handle multiple messages within retention period', async function () {
      const freeTemplate = await session.createTemplate({
        noFeedId: true,
        steps: [
          {
            type: StepTypeEnum.IN_APP,
            content: 'Test content for free tier',
            actor: {
              type: ActorTypeEnum.SYSTEM_ICON,
              data: SystemAvatarIconEnum.WARNING,
            },
          },
        ],
      });

      const now = new Date();
      const messages = [subHours(now, 1), subHours(now, 5), subHours(now, 10), subHours(now, 15), subHours(now, 20)];

      await communityOrganizationRepository.update(
        { _id: session.organization._id },
        { apiServiceLevel: ApiServiceLevelEnum.FREE }
      );
      await createMessagesWithDates(session, messages, freeTemplate, subscriberRepository);

      const { body, status } = await getNotificationsCount([{}]);

      expect(status).to.equal(200);
      expect(body.data).to.be.ok;
      expect(body.data.length).to.eq(1);
      expect(body.data[0].count).to.eq(5);
    });
  });
});

const createMessagesWithDates = async (
  session: UserSession,
  dates: Date[],
  template: NotificationTemplateEntity,
  subscriberRepository: SubscriberRepository
) => {
  // const novuClient = initNovuClassSdk(session);
  const subscriber = await subscriberRepository.findBySubscriberId(session.environment._id, session.subscriberId);

  if (!subscriber) {
    throw new Error('Subscriber not found');
  }

  const messageRepository = new MessageRepository();

  // Create messages with specific dates
  for (const date of dates) {
    await messageRepository.create({
      _environmentId: session.environment._id,
      _organizationId: session.organization._id,
      _subscriberId: subscriber._id,
      channel: ChannelTypeEnum.IN_APP,
      content: 'Test content',
      createdAt: date,
      updatedAt: date,
      read: false,
      archived: false,
      template: {
        _id: template._id,
        name: template.name,
      },
    });
  }
};

const getNotificationsCount2 = async (
  session: UserSession,
  filters: Array<{ tags?: string[]; read?: boolean; archived?: boolean }>
) => {
  return await session.testAgent
    .get(`/v1/inbox/notifications/count?filters=${JSON.stringify(filters)}`)
    .set('Authorization', `Bearer ${session.token}`);
};
