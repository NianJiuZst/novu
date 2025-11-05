import { Novu } from '@novu/api';
import {
  SubscriberPayloadDto,
  TopicPayloadDto,
  TopicResponseDto,
  TriggerEventRequestDto,
  TriggerRecipientsTypeEnum,
} from '@novu/api/models/components';
import { MessageRepository, NotificationRepository, NotificationTemplateEntity, SubscriberEntity } from '@novu/dal';
import {
  ChannelTypeEnum,
  DigestTypeEnum,
  DigestUnitEnum,
  ExternalSubscriberId,
  IEmailBlock,
  StepTypeEnum,
  TopicKey,
  TopicName,
} from '@novu/shared';
import { SubscribersService, UserSession } from '@novu/testing';
import { expect } from 'chai';
import { initNovuClassSdk } from '../../shared/helpers/e2e/sdk/e2e-sdk.helper';

describe('Topic Trigger Event #novu-v2', () => {
  describe('Trigger event for a topic - /v1/events/trigger (POST)', () => {
    let session: UserSession;
    let template: NotificationTemplateEntity;
    let firstSubscriber: SubscriberEntity;
    let secondSubscriber: SubscriberEntity;
    let subscribers: SubscriberEntity[];
    let subscriberService: SubscribersService;
    let createdTopicDto: TopicResponseDto;
    let to: Array<TopicPayloadDto | SubscriberPayloadDto | string>;
    const notificationRepository = new NotificationRepository();
    const messageRepository = new MessageRepository();
    let novuClient: Novu;

    beforeEach(async () => {
      session = new UserSession();
      await session.initialize();

      template = await session.createTemplate();
      subscriberService = new SubscribersService(session.organization._id, session.environment._id);
      firstSubscriber = await subscriberService.createSubscriber();
      secondSubscriber = await subscriberService.createSubscriber();
      subscribers = [firstSubscriber, secondSubscriber];

      const topicKey = 'topic-key-trigger-event';
      const topicName = 'topic-name-trigger-event';
      createdTopicDto = await createTopic(session, topicKey, topicName);
      await addSubscribersToTopic(session, createdTopicDto, subscribers);
      to = [{ type: TriggerRecipientsTypeEnum.Topic, topicKey: createdTopicDto.key }];
      novuClient = initNovuClassSdk(session);
    });

    it('should trigger an event successfully', async () => {
      const response = await novuClient.trigger(buildTriggerRequestPayload(template, to));

      const body = response.result;

      expect(body).to.be.ok;
      expect(body.status).to.equal('processed');
      expect(body.acknowledged).to.equal(true);
      expect(body.transactionId).to.exist;
    });

    it('should generate message and notification based on event', async () => {
      const attachments = [
        {
          name: 'text1.txt',
          file: 'hello world!',
        },
        {
          name: 'text2.txt',
          file: Buffer.from('hello world!', 'utf-8'),
        },
      ];

      await novuClient.trigger(buildTriggerRequestPayload(template, to, attachments));

      await session.waitForJobCompletion(template._id);

      expect(subscribers.length).to.be.greaterThan(0);

      for (const subscriber of subscribers) {
        const notifications = await notificationRepository.findBySubscriberId(session.environment._id, subscriber._id);

        expect(notifications.length).to.equal(1);

        const notification = notifications[0];

        expect(notification._organizationId).to.equal(session.organization._id);
        expect(notification._templateId).to.equal(template._id);

        const messages = await messageRepository.findBySubscriberChannel(
          session.environment._id,
          subscriber._id,
          ChannelTypeEnum.IN_APP
        );

        expect(messages.length).to.equal(1);
        const message = messages[0];

        expect(message.channel).to.equal(ChannelTypeEnum.IN_APP);
        expect(message.content as string).to.equal('Test content for <b>Testing of User Name</b>');
        expect(message.seen).to.equal(false);
        expect(message.cta.data.url).to.equal('/cypress/test-shell/example/test?test-param=true');
        expect(message.lastSeenDate).to.be.not.ok;
        expect(message.payload.firstName).to.equal('Testing of User Name');
        expect(message.payload.urlVariable).to.equal('/test/url/path');
        expect(message.payload.attachments).to.be.not.ok;

        const emails = await messageRepository.findBySubscriberChannel(
          session.environment._id,
          subscriber._id,
          ChannelTypeEnum.EMAIL
        );

        expect(emails.length).to.equal(1);
        const email = emails[0];

        expect(email.channel).to.equal(ChannelTypeEnum.EMAIL);
        expect(Array.isArray(email.content)).to.be.ok;
        expect((email.content[0] as IEmailBlock).type).to.equal('text');
        expect((email.content[0] as IEmailBlock).content).to.equal(
          'This are the text contents of the template for Testing of User Name'
        );
      }
    });

    it('should exclude actor from topic events trigger', async () => {
      const actor = firstSubscriber;
      await novuClient.trigger({
        ...buildTriggerRequestPayload(template, to),
        actor: { subscriberId: actor.subscriberId },
      });

      await session.waitForJobCompletion(template._id);

      const actorNotifications = await notificationRepository.findBySubscriberId(session.environment._id, actor._id);
      expect(actorNotifications.length).to.equal(0);

      const actorMessages = await messageRepository.findBySubscriberChannel(
        session.environment._id,
        actor._id,
        ChannelTypeEnum.IN_APP
      );

      expect(actorMessages.length).to.equal(0);

      const actorEmails = await messageRepository.findBySubscriberChannel(
        session.environment._id,
        actor._id,
        ChannelTypeEnum.EMAIL
      );
      expect(actorEmails.length).to.equal(0);

      const secondSubscriberNotifications = await notificationRepository.findBySubscriberId(
        session.environment._id,
        secondSubscriber._id
      );

      expect(secondSubscriberNotifications.length).to.equal(1);

      const secondSubscriberMessages = await messageRepository.findBySubscriberChannel(
        session.environment._id,
        secondSubscriber._id,
        ChannelTypeEnum.IN_APP
      );

      expect(secondSubscriberMessages.length).to.equal(1);

      const secondSubscriberEmails = await messageRepository.findBySubscriberChannel(
        session.environment._id,
        secondSubscriber._id,
        ChannelTypeEnum.EMAIL
      );

      expect(secondSubscriberEmails.length).to.equal(1);
    });

    it('should exclude specific subscribers from topic using exclude array', async () => {
      const excludedSubscriber = firstSubscriber;
      const toWithExclude = [
        {
          type: TriggerRecipientsTypeEnum.Topic,
          topicKey: createdTopicDto.key,
          exclude: [excludedSubscriber.subscriberId],
        },
      ];

      await novuClient.trigger(buildTriggerRequestPayload(template, toWithExclude));

      await session.waitForJobCompletion(template._id);

      const excludedSubscriberNotifications = await notificationRepository.findBySubscriberId(
        session.environment._id,
        excludedSubscriber._id
      );
      expect(excludedSubscriberNotifications.length).to.equal(0);

      const excludedSubscriberMessages = await messageRepository.findBySubscriberChannel(
        session.environment._id,
        excludedSubscriber._id,
        ChannelTypeEnum.IN_APP
      );
      expect(excludedSubscriberMessages.length).to.equal(0);

      const excludedSubscriberEmails = await messageRepository.findBySubscriberChannel(
        session.environment._id,
        excludedSubscriber._id,
        ChannelTypeEnum.EMAIL
      );
      expect(excludedSubscriberEmails.length).to.equal(0);

      const secondSubscriberNotifications = await notificationRepository.findBySubscriberId(
        session.environment._id,
        secondSubscriber._id
      );
      expect(secondSubscriberNotifications.length).to.equal(1);

      const secondSubscriberMessages = await messageRepository.findBySubscriberChannel(
        session.environment._id,
        secondSubscriber._id,
        ChannelTypeEnum.IN_APP
      );
      expect(secondSubscriberMessages.length).to.equal(1);

      const secondSubscriberEmails = await messageRepository.findBySubscriberChannel(
        session.environment._id,
        secondSubscriber._id,
        ChannelTypeEnum.EMAIL
      );
      expect(secondSubscriberEmails.length).to.equal(1);
    });

    it('should exclude multiple subscribers from topic using exclude array', async () => {
      const toWithExclude = [
        {
          type: TriggerRecipientsTypeEnum.Topic,
          topicKey: createdTopicDto.key,
          exclude: [firstSubscriber.subscriberId, secondSubscriber.subscriberId],
        },
      ];

      await novuClient.trigger(buildTriggerRequestPayload(template, toWithExclude));

      await session.waitForJobCompletion(template._id);

      const firstSubscriberNotifications = await notificationRepository.findBySubscriberId(
        session.environment._id,
        firstSubscriber._id
      );
      expect(firstSubscriberNotifications.length).to.equal(0);

      const secondSubscriberNotifications = await notificationRepository.findBySubscriberId(
        session.environment._id,
        secondSubscriber._id
      );
      expect(secondSubscriberNotifications.length).to.equal(0);
    });

    it('should only exclude actor from topic, should send event if actor explicitly included', async () => {
      const actor = firstSubscriber;
      await novuClient.trigger({
        ...buildTriggerRequestPayload(template, [...to, actor.subscriberId]),
        actor: { subscriberId: actor.subscriberId },
      });

      await session.waitForJobCompletion(template._id);

      for (const subscriber of subscribers) {
        const notifications = await notificationRepository.findBySubscriberId(session.environment._id, subscriber._id);

        expect(notifications.length).to.equal(1);

        const notification = notifications[0];

        expect(notification._organizationId).to.equal(session.organization._id);
        expect(notification._templateId).to.equal(template._id);

        const messages = await messageRepository.findBySubscriberChannel(
          session.environment._id,
          subscriber._id,
          ChannelTypeEnum.IN_APP
        );

        expect(messages.length).to.equal(1);
        const message = messages[0];

        expect(message.channel).to.equal(ChannelTypeEnum.IN_APP);
        expect(message.content as string).to.equal('Test content for <b>Testing of User Name</b>');
        expect(message.seen).to.equal(false);
        expect(message.cta.data.url).to.equal('/cypress/test-shell/example/test?test-param=true');
        expect(message.lastSeenDate).to.be.not.ok;
        expect(message.payload.firstName).to.equal('Testing of User Name');
        expect(message.payload.urlVariable).to.equal('/test/url/path');
        expect(message.payload.attachments).to.be.not.ok;

        const emails = await messageRepository.findBySubscriberChannel(
          session.environment._id,
          subscriber._id,
          ChannelTypeEnum.EMAIL
        );

        expect(emails.length).to.equal(1);
        const email = emails[0];

        expect(email.channel).to.equal(ChannelTypeEnum.EMAIL);
        expect(Array.isArray(email.content)).to.be.ok;
        expect((email.content[0] as IEmailBlock).type).to.equal('text');
        expect((email.content[0] as IEmailBlock).content).to.equal(
          'This are the text contents of the template for Testing of User Name'
        );
      }
    });

    it('should trigger SMS notification', async () => {
      template = await session.createTemplate({
        steps: [
          {
            type: StepTypeEnum.SMS,
            content: 'Hello world {{customVar}}' as string,
          },
        ],
      });

      await novuClient.trigger(buildTriggerRequestPayload(template, to));

      await session.waitForJobCompletion(template._id);

      expect(subscribers.length).to.be.greaterThan(0);

      for (const subscriber of subscribers) {
        const message = await messageRepository._model.findOne({
          _environmentId: session.environment._id,
          _templateId: template._id,
          _subscriberId: subscriber._id,
          channel: ChannelTypeEnum.SMS,
        });

        expect(message?._subscriberId.toString()).to.be.eql(subscriber._id);
        expect(message?.phone).to.equal(subscriber.phone);
      }
    });

    it('should deliver only to subscriptions with passing conditions', async () => {
      const conditionsTopicKey = `topic-key-conditions-${Date.now()}`;

      const newSubscriber = await subscriberService.createSubscriber();
      await novuClient.topics.subscriptions.create(
        {
          subscriberIds: [newSubscriber.subscriberId],
          rules: [
            {
              filter: {
                workflows: [template._id],
              },
              type: 'custom',
              condition: {
                and: [
                  {
                    '==': [
                      {
                        var: 'payload.status',
                      },
                      'completed',
                    ],
                  },
                  {
                    '>': [
                      {
                        var: 'payload.price',
                      },
                      100,
                    ],
                  },
                ],
              },
            },
          ],
        } as any,
        conditionsTopicKey
      );

      await novuClient.topics.subscriptions.create(
        {
          subscriberIds: [secondSubscriber.subscriberId],
          rules: [
            {
              filter: {
                workflows: [template._id],
              },
              type: 'custom',
              condition: {
                '==': [
                  {
                    var: 'payload.status',
                  },
                  'failed',
                ],
              },
            },
          ],
        } as any,
        conditionsTopicKey
      );

      const toWithConditions = [{ type: TriggerRecipientsTypeEnum.Topic, topicKey: conditionsTopicKey }];

      await novuClient.trigger({
        workflowId: template.triggers[0].identifier,
        to: toWithConditions,
        payload: { status: 'completed', price: 150 },
      });

      await session.waitForJobCompletion(template._id);

      const passMessages = await messageRepository.find({
        _environmentId: session.environment._id,
        _subscriberId: newSubscriber._id,
        _templateId: template._id,
        channel: ChannelTypeEnum.IN_APP,
      });

      expect(passMessages.length, 'Passed Subscription Messages, expected to delivery the message').to.equal(1);

      await novuClient.trigger({
        workflowId: template.triggers[0].identifier,
        to: toWithConditions,
        payload: { status: 'not-completed', price: 150 },
      });

      await session.waitForJobCompletion(template._id);

      const filteredSubscriptionMessage = await messageRepository.find({
        _environmentId: session.environment._id,
        _subscriberId: newSubscriber._id,
        _templateId: template._id,
        channel: ChannelTypeEnum.IN_APP,
      });

      // messages were not incremented because with subscription was filtered out
      expect(
        filteredSubscriptionMessage.length,
        'Filtered Subscription Messages, expected to not delivery the message'
      ).to.equal(1);
    });
  });

  describe('Trigger event for multiple topics and multiple subscribers - /v1/events/trigger (POST)', () => {
    let session: UserSession;
    let template: NotificationTemplateEntity;
    let firstSubscriber: SubscriberEntity;
    let secondSubscriber: SubscriberEntity;
    let thirdSubscriber: SubscriberEntity;
    let fourthSubscriber: SubscriberEntity;
    let fifthSubscriber: SubscriberEntity;
    let sixthSubscriber: SubscriberEntity;
    let firstTopicSubscribers: SubscriberEntity[];
    let subscribers: SubscriberEntity[];
    let subscriberService: SubscribersService;
    let firstTopicDto: TopicResponseDto;
    let secondTopicDto: TopicResponseDto;
    let to: Array<TopicPayloadDto | SubscriberPayloadDto | string>;
    const notificationRepository = new NotificationRepository();
    const messageRepository = new MessageRepository();
    let novuClient: Novu;

    beforeEach(async () => {
      session = new UserSession();
      await session.initialize();

      template = await session.createTemplate();
      subscriberService = new SubscribersService(session.organization._id, session.environment._id);
      firstSubscriber = await subscriberService.createSubscriber();
      secondSubscriber = await subscriberService.createSubscriber();
      firstTopicSubscribers = [firstSubscriber, secondSubscriber];

      const firstTopicKey = 'topic-key-1-trigger-event';
      const firstTopicName = 'topic-name-1-trigger-event';
      firstTopicDto = await createTopic(session, firstTopicKey, firstTopicName);

      await addSubscribersToTopic(session, firstTopicDto, firstTopicSubscribers);

      thirdSubscriber = await subscriberService.createSubscriber();
      fourthSubscriber = await subscriberService.createSubscriber();
      const secondTopicSubscribers = [thirdSubscriber, fourthSubscriber];

      const secondTopicKey = 'topic-key-2-trigger-event';
      const secondTopicName = 'topic-name-2-trigger-event';
      secondTopicDto = await createTopic(session, secondTopicKey, secondTopicName);

      await addSubscribersToTopic(session, secondTopicDto, secondTopicSubscribers);

      fifthSubscriber = await subscriberService.createSubscriber();
      sixthSubscriber = await subscriberService.createSubscriber();

      subscribers = [
        firstSubscriber,
        secondSubscriber,
        thirdSubscriber,
        fourthSubscriber,
        fifthSubscriber,
        sixthSubscriber,
      ];
      to = [
        { type: TriggerRecipientsTypeEnum.Topic, topicKey: firstTopicDto.key },
        { type: TriggerRecipientsTypeEnum.Topic, topicKey: secondTopicDto.key },
        fifthSubscriber.subscriberId,
        {
          subscriberId: sixthSubscriber.subscriberId,
          firstName: 'Subscribers',
          lastName: 'Define',
          email: 'subscribers-define@email.novu',
        },
      ];
      novuClient = initNovuClassSdk(session);
    });

    it('should trigger an event successfully', async () => {
      const localTo = [...to, { type: TriggerRecipientsTypeEnum.Topic, topicKey: 'non-existing-topic-key' }];
      const response = await novuClient.trigger(buildTriggerRequestPayload(template, localTo));

      await session.waitForJobCompletion(template._id);

      const body = response.result;

      expect(body).to.be.ok;
      expect(body.status).to.equal('processed');
      expect(body.acknowledged).to.equal(true);
      expect(body.transactionId).to.exist;

      const messageCount = await messageRepository.count({
        _environmentId: session.environment._id,
        transactionId: body.transactionId,
      });

      expect(messageCount).to.equal(12);
    });

    it('should generate message and notification based on event', async () => {
      const attachments = [
        {
          name: 'text1.txt',
          file: 'hello world!',
        },
        {
          name: 'text2.txt',
          file: Buffer.from('hello world!', 'utf-8'),
        },
      ];

      await novuClient.trigger(buildTriggerRequestPayload(template, to, attachments));

      await session.waitForJobCompletion(template._id);
      expect(subscribers.length).to.be.greaterThan(0);

      for (const subscriber of subscribers) {
        const notifications = await notificationRepository.findBySubscriberId(session.environment._id, subscriber._id);

        expect(notifications.length).to.equal(1);

        const notification = notifications[0];

        expect(notification._organizationId).to.equal(session.organization._id);
        expect(notification._templateId).to.equal(template._id);

        const messages = await messageRepository.findBySubscriberChannel(
          session.environment._id,
          subscriber._id,
          ChannelTypeEnum.IN_APP
        );

        expect(messages.length).to.equal(1);
        const message = messages[0];

        expect(message.channel).to.equal(ChannelTypeEnum.IN_APP);
        expect(message.content as string).to.equal('Test content for <b>Testing of User Name</b>');
        expect(message.seen).to.equal(false);
        expect(message.cta.data.url).to.equal('/cypress/test-shell/example/test?test-param=true');
        expect(message.lastSeenDate).to.be.not.ok;
        expect(message.payload.firstName).to.equal('Testing of User Name');
        expect(message.payload.urlVariable).to.equal('/test/url/path');
        expect(message.payload.attachments).to.be.not.ok;

        const emails = await messageRepository.findBySubscriberChannel(
          session.environment._id,
          subscriber._id,
          ChannelTypeEnum.EMAIL
        );

        expect(emails.length).to.equal(1);
        const email = emails[0];

        expect(email.channel).to.equal(ChannelTypeEnum.EMAIL);
        expect(Array.isArray(email.content)).to.be.ok;
        expect((email.content[0] as IEmailBlock).type).to.equal('text');
        expect((email.content[0] as IEmailBlock).content).to.equal(
          'This are the text contents of the template for Testing of User Name'
        );
      }
    });

    it('should trigger SMS notification', async () => {
      template = await session.createTemplate({
        steps: [
          {
            type: StepTypeEnum.SMS,
            content: 'Hello world {{customVar}}' as string,
          },
        ],
      });

      await novuClient.trigger(buildTriggerRequestPayload(template, to));

      await session.waitForJobCompletion(template._id);

      expect(subscribers.length).to.be.greaterThan(0);

      for (const subscriber of subscribers) {
        const message = await messageRepository._model.findOne({
          _environmentId: session.environment._id,
          _templateId: template._id,
          _subscriberId: subscriber._id,
          channel: ChannelTypeEnum.SMS,
        });

        expect(message?._subscriberId.toString()).to.be.eql(subscriber._id);
        expect(message?.phone).to.equal(subscriber.phone);
      }
    });

    it('should deliver considering subscription workflows enablement', async () => {
      const workflowsTopicKeyEnabled = `topic-key-workflows-enabled-${Date.now()}`;
      const workflowsTopicKeyDisabled = `topic-key-workflows-disabled-${Date.now()}`;
      const workflowsTopicKeyNoWorkflows = `topic-key-workflows-no-workflows-${Date.now()}`;

      const subscribedSubscriber = await subscriberService.createSubscriber();

      const workflowId = template._id;
      const triggerIdentifier = template.triggers[0].identifier;

      await novuClient.topics.subscriptions.create(
        {
          subscriberIds: [subscribedSubscriber.subscriberId],
          rules: [
            {
              type: 'checkbox',
              condition: true,
              filter: {
                workflows: [workflowId],
              },
            },
          ],
        } as any,
        workflowsTopicKeyEnabled
      );

      await novuClient.topics.subscriptions.create(
        {
          subscriberIds: [subscribedSubscriber.subscriberId],
          rules: [
            {
              type: 'checkbox',
              condition: false,
              filter: {
                workflows: [workflowId],
              },
            },
          ],
        } as any,
        workflowsTopicKeyDisabled
      );

      // Create subscription without workflows (opt-in feature -> should still send)
      await novuClient.topics.subscriptions.create(
        {
          subscriberIds: [subscribedSubscriber.subscriberId],
        },
        workflowsTopicKeyNoWorkflows
      );

      // Trigger event with workflows enabled
      await novuClient.trigger({
        workflowId: triggerIdentifier,
        to: [{ type: TriggerRecipientsTypeEnum.Topic, topicKey: workflowsTopicKeyEnabled }],
      });
      await session.waitForJobCompletion(template._id);
      const enabledMessages = await messageRepository.find({
        _environmentId: session.environment._id,
        _subscriberId: subscribedSubscriber._id,
        _templateId: template._id,
        channel: ChannelTypeEnum.IN_APP,
      });
      expect(enabledMessages.length, 'Enabled Subscription Messages, expected to delivery the message').to.equal(1);

      // Trigger event with workflows disabled
      await novuClient.trigger({
        workflowId: triggerIdentifier,
        to: [{ type: TriggerRecipientsTypeEnum.Topic, topicKey: workflowsTopicKeyDisabled }],
      });
      await session.waitForJobCompletion(template._id);
      const disabledMessages = await messageRepository.find({
        _environmentId: session.environment._id,
        _subscriberId: subscribedSubscriber._id,
        _templateId: template._id,
        channel: ChannelTypeEnum.IN_APP,
      });
      expect(disabledMessages.length, 'Disabled Subscription Messages, expected to not delivery the message').to.equal(
        1
      );

      // Trigger event with no workflows
      await novuClient.trigger({
        workflowId: triggerIdentifier,
        to: [{ type: TriggerRecipientsTypeEnum.Topic, topicKey: workflowsTopicKeyNoWorkflows }],
      });
      await session.waitForJobCompletion(template._id);
      const noWorkflowsMessages = await messageRepository.find({
        _environmentId: session.environment._id,
        _subscriberId: subscribedSubscriber._id,
        _templateId: template._id,
        channel: ChannelTypeEnum.IN_APP,
      });
      expect(
        noWorkflowsMessages.length,
        'No Workflow Subscription Messages, expected to delivery the message'
      ).to.equal(2);
    });

    it('should filter subscriptions by tags and combined workflow filters', async () => {
      const tagFilterTopicKey = `topic-key-tag-filter-${Date.now()}`;
      const combinedFilterTopicKey = `topic-key-combined-filter-${Date.now()}`;
      const nonMatchingTagTopicKey = `topic-key-non-matching-tag-${Date.now()}`;

      const taggedTemplate = await session.createTemplate({
        tags: ['important', 'promotional'],
      });
      const otherTaggedTemplate = await session.createTemplate({
        tags: ['newsletter'],
      });

      const subscriberWithTagFilter = await subscriberService.createSubscriber();
      const subscriberWithCombinedFilter = await subscriberService.createSubscriber();
      const subscriberWithNonMatchingTag = await subscriberService.createSubscriber();

      await novuClient.topics.subscriptions.create(
        {
          subscriberIds: [subscriberWithTagFilter.subscriberId],
          rules: [
            {
              type: 'custom',
              condition: {
                '==': [{ var: 'payload.status' }, 'active'],
              },
              filter: {
                tags: ['important'],
              },
            },
          ],
        } as any,
        tagFilterTopicKey
      );

      await novuClient.topics.subscriptions.create(
        {
          subscriberIds: [subscriberWithCombinedFilter.subscriberId],
          rules: [
            {
              type: 'checkbox',
              condition: true,
              filter: {
                workflows: [taggedTemplate._id],
                tags: ['promotional'],
              },
            },
          ],
        } as any,
        combinedFilterTopicKey
      );

      await novuClient.topics.subscriptions.create(
        {
          subscriberIds: [subscriberWithNonMatchingTag.subscriberId],
          rules: [
            {
              type: 'custom',
              condition: {
                '==': [{ var: 'payload.status' }, 'active'],
              },
              filter: {
                tags: ['nonexistent-tag'],
              },
            },
          ],
        } as any,
        nonMatchingTagTopicKey
      );

      await novuClient.trigger({
        workflowId: taggedTemplate.triggers[0].identifier,
        to: [{ type: TriggerRecipientsTypeEnum.Topic, topicKey: tagFilterTopicKey }],
        payload: { status: 'active' },
      });
      await session.waitForJobCompletion(taggedTemplate._id);

      const tagFilterMessages = await messageRepository.find({
        _environmentId: session.environment._id,
        _subscriberId: subscriberWithTagFilter._id,
        _templateId: taggedTemplate._id,
        channel: ChannelTypeEnum.IN_APP,
      });
      expect(tagFilterMessages.length, 'Tag filter should deliver when tag matches').to.equal(1);

      await novuClient.trigger({
        workflowId: taggedTemplate.triggers[0].identifier,
        to: [{ type: TriggerRecipientsTypeEnum.Topic, topicKey: combinedFilterTopicKey }],
      });
      await session.waitForJobCompletion(taggedTemplate._id);

      const combinedFilterMessages = await messageRepository.find({
        _environmentId: session.environment._id,
        _subscriberId: subscriberWithCombinedFilter._id,
        _templateId: taggedTemplate._id,
        channel: ChannelTypeEnum.IN_APP,
      });
      expect(
        combinedFilterMessages.length,
        'Combined filter should deliver when both workflow ID and tag match'
      ).to.equal(1);

      await novuClient.trigger({
        workflowId: taggedTemplate.triggers[0].identifier,
        to: [{ type: TriggerRecipientsTypeEnum.Topic, topicKey: nonMatchingTagTopicKey }],
        payload: { status: 'active' },
      });
      await session.waitForJobCompletion(taggedTemplate._id);

      const nonMatchingTagMessages = await messageRepository.find({
        _environmentId: session.environment._id,
        _subscriberId: subscriberWithNonMatchingTag._id,
        _templateId: taggedTemplate._id,
        channel: ChannelTypeEnum.IN_APP,
      });
      expect(nonMatchingTagMessages.length, 'Non-matching tag filter should not deliver').to.equal(0);

      await novuClient.trigger({
        workflowId: otherTaggedTemplate.triggers[0].identifier,
        to: [{ type: TriggerRecipientsTypeEnum.Topic, topicKey: tagFilterTopicKey }],
        payload: { status: 'active' },
      });
      await session.waitForJobCompletion(otherTaggedTemplate._id);

      const tagFilterMessagesAfterOtherTemplate = await messageRepository.find({
        _environmentId: session.environment._id,
        _subscriberId: subscriberWithTagFilter._id,
        _templateId: otherTaggedTemplate._id,
        channel: ChannelTypeEnum.IN_APP,
      });
      expect(
        tagFilterMessagesAfterOtherTemplate.length,
        'Tag filter should not deliver when workflow tag does not match filter'
      ).to.equal(0);
    });

    it('should require all rules to pass for subscription delivery', async () => {
      const multipleRulesTopicKey = `topic-key-multiple-rules-${Date.now()}`;

      const subscriberAllPassing = await subscriberService.createSubscriber();
      const subscriberOneFailing = await subscriberService.createSubscriber();
      const subscriberMixedRules = await subscriberService.createSubscriber();

      await novuClient.topics.subscriptions.create(
        {
          subscriberIds: [subscriberAllPassing.subscriberId],
          rules: [
            {
              type: 'custom',
              condition: {
                '>': [{ var: 'payload.price' }, 100],
              },
              filter: {
                workflows: [template._id],
              },
            },
            {
              type: 'custom',
              condition: {
                '==': [{ var: 'payload.status' }, 'active'],
              },
              filter: {
                workflows: [template._id],
              },
            },
          ],
        } as any,
        multipleRulesTopicKey
      );

      await novuClient.topics.subscriptions.create(
        {
          subscriberIds: [subscriberOneFailing.subscriberId],
          rules: [
            {
              type: 'custom',
              condition: {
                '>': [{ var: 'payload.price' }, 100],
              },
              filter: {
                workflows: [template._id],
              },
            },
            {
              type: 'custom',
              condition: {
                '==': [{ var: 'payload.status' }, 'inactive'],
              },
              filter: {
                workflows: [template._id],
              },
            },
          ],
        } as any,
        multipleRulesTopicKey
      );

      await novuClient.topics.subscriptions.create(
        {
          subscriberIds: [subscriberMixedRules.subscriberId],
          rules: [
            {
              type: 'checkbox',
              condition: true,
              filter: {
                workflows: [template._id],
              },
            },
            {
              type: 'custom',
              condition: {
                '==': [{ var: 'payload.category' }, 'premium'],
              },
              filter: {
                workflows: [template._id],
              },
            },
          ],
        } as any,
        multipleRulesTopicKey
      );

      await novuClient.trigger({
        workflowId: template.triggers[0].identifier,
        to: [{ type: TriggerRecipientsTypeEnum.Topic, topicKey: multipleRulesTopicKey }],
        payload: { price: 150, status: 'active', category: 'premium' },
      });
      await session.waitForJobCompletion(template._id);

      const allPassingMessages = await messageRepository.find({
        _environmentId: session.environment._id,
        _subscriberId: subscriberAllPassing._id,
        _templateId: template._id,
        channel: ChannelTypeEnum.IN_APP,
      });
      expect(allPassingMessages.length, 'All rules passing should deliver').to.equal(1);

      const oneFailingMessages = await messageRepository.find({
        _environmentId: session.environment._id,
        _subscriberId: subscriberOneFailing._id,
        _templateId: template._id,
        channel: ChannelTypeEnum.IN_APP,
      });
      expect(oneFailingMessages.length, 'One rule failing should not deliver').to.equal(0);

      const mixedRulesMessages = await messageRepository.find({
        _environmentId: session.environment._id,
        _subscriberId: subscriberMixedRules._id,
        _templateId: template._id,
        channel: ChannelTypeEnum.IN_APP,
      });
      expect(mixedRulesMessages.length, 'Mixed checkbox and custom rules all passing should deliver').to.equal(1);

      await novuClient.trigger({
        workflowId: template.triggers[0].identifier,
        to: [{ type: TriggerRecipientsTypeEnum.Topic, topicKey: multipleRulesTopicKey }],
        payload: { price: 150, status: 'active', category: 'standard' },
      });
      await session.waitForJobCompletion(template._id);

      const mixedRulesMessagesAfterSecondTrigger = await messageRepository.find({
        _environmentId: session.environment._id,
        _subscriberId: subscriberMixedRules._id,
        _templateId: template._id,
        channel: ChannelTypeEnum.IN_APP,
      });
      expect(
        mixedRulesMessagesAfterSecondTrigger.length,
        'Mixed rules with second rule failing should not deliver additional message'
      ).to.equal(1);
    });

    it('should handle workflow filter mismatches correctly', async () => {
      const workflowMismatchTopicKey = `topic-key-workflow-mismatch-${Date.now()}`;

      const differentTemplate = await session.createTemplate();
      const subscriberConditionPassWorkflowFail = await subscriberService.createSubscriber();
      const subscriberConditionFailWorkflowPass = await subscriberService.createSubscriber();
      const subscriberCheckboxEnabledWorkflowFail = await subscriberService.createSubscriber();

      await novuClient.topics.subscriptions.create(
        {
          subscriberIds: [subscriberConditionPassWorkflowFail.subscriberId],
          rules: [
            {
              type: 'custom',
              condition: {
                '==': [{ var: 'payload.status' }, 'active'],
              },
              filter: {
                workflows: [differentTemplate._id],
              },
            },
          ],
        } as any,
        workflowMismatchTopicKey
      );

      await novuClient.topics.subscriptions.create(
        {
          subscriberIds: [subscriberConditionFailWorkflowPass.subscriberId],
          rules: [
            {
              type: 'custom',
              condition: {
                '==': [{ var: 'payload.status' }, 'inactive'],
              },
              filter: {
                workflows: [template._id],
              },
            },
          ],
        } as any,
        workflowMismatchTopicKey
      );

      await novuClient.topics.subscriptions.create(
        {
          subscriberIds: [subscriberCheckboxEnabledWorkflowFail.subscriberId],
          rules: [
            {
              type: 'checkbox',
              condition: true,
              filter: {
                workflows: [differentTemplate._id],
              },
            },
          ],
        } as any,
        workflowMismatchTopicKey
      );

      await novuClient.trigger({
        workflowId: template.triggers[0].identifier,
        to: [{ type: TriggerRecipientsTypeEnum.Topic, topicKey: workflowMismatchTopicKey }],
        payload: { status: 'active' },
      });
      await session.waitForJobCompletion(template._id);

      const conditionPassWorkflowFailMessages = await messageRepository.find({
        _environmentId: session.environment._id,
        _subscriberId: subscriberConditionPassWorkflowFail._id,
        _templateId: template._id,
        channel: ChannelTypeEnum.IN_APP,
      });
      expect(
        conditionPassWorkflowFailMessages.length,
        'Condition passes but workflow filter does not match should not deliver'
      ).to.equal(0);

      const conditionFailWorkflowPassMessages = await messageRepository.find({
        _environmentId: session.environment._id,
        _subscriberId: subscriberConditionFailWorkflowPass._id,
        _templateId: template._id,
        channel: ChannelTypeEnum.IN_APP,
      });
      expect(
        conditionFailWorkflowPassMessages.length,
        'Condition fails but workflow filter matches should not deliver'
      ).to.equal(0);

      const checkboxEnabledWorkflowFailMessages = await messageRepository.find({
        _environmentId: session.environment._id,
        _subscriberId: subscriberCheckboxEnabledWorkflowFail._id,
        _templateId: template._id,
        channel: ChannelTypeEnum.IN_APP,
      });
      expect(
        checkboxEnabledWorkflowFailMessages.length,
        'Checkbox enabled but workflow filter does not match should not deliver'
      ).to.equal(0);

      await novuClient.trigger({
        workflowId: differentTemplate.triggers[0].identifier,
        to: [{ type: TriggerRecipientsTypeEnum.Topic, topicKey: workflowMismatchTopicKey }],
        payload: { status: 'active' },
      });
      await session.waitForJobCompletion(differentTemplate._id);

      const conditionPassWorkflowMatchMessages = await messageRepository.find({
        _environmentId: session.environment._id,
        _subscriberId: subscriberConditionPassWorkflowFail._id,
        _templateId: differentTemplate._id,
        channel: ChannelTypeEnum.IN_APP,
      });
      expect(
        conditionPassWorkflowMatchMessages.length,
        'Condition passes and workflow filter matches should deliver'
      ).to.equal(1);
    });

    it('should not contain events from a different digestKey ', async () => {
      template = await session.createTemplate({
        steps: [
          {
            type: StepTypeEnum.DIGEST,
            content: '',
            metadata: {
              unit: DigestUnitEnum.SECONDS,
              amount: 1,
              digestKey: 'id',
              type: DigestTypeEnum.REGULAR,
            },
          },
          {
            type: StepTypeEnum.IN_APP,
            content: '{{#each step.events}}{{id}} {{/each}}' as string,
          },
        ],
      });
      const toFirstTopic = [{ type: TriggerRecipientsTypeEnum.Topic, topicKey: firstTopicDto.key }];

      await triggerEvent(session, template, toFirstTopic, {
        id: 'key-1',
      });
      await triggerEvent(session, template, toFirstTopic, {
        id: 'key-1',
      });
      await triggerEvent(session, template, toFirstTopic, {
        id: 'key-1',
      });
      await triggerEvent(session, template, toFirstTopic, {
        id: 'key-2',
      });
      await triggerEvent(session, template, toFirstTopic, {
        id: 'key-2',
      });
      await triggerEvent(session, template, toFirstTopic, {
        id: 'key-2',
      });

      await session.waitForJobCompletion(template._id);

      for (const subscriber of firstTopicSubscribers) {
        const messages = await messageRepository.findBySubscriberChannel(
          session.environment._id,
          subscriber._id,
          ChannelTypeEnum.IN_APP
        );
        expect(messages.length).to.equal(2);
        for (const message of messages) {
          const digestKey = message.payload.id;
          expect(message.content).to.equal(`${digestKey} ${digestKey} ${digestKey} `);
        }
      }
    });
  });
});

const createTopic = async (session: UserSession, key: TopicKey, name: TopicName): Promise<TopicResponseDto> => {
  const response = await initNovuClassSdk(session).topics.create({ key, name });

  expect(response.result.id).to.exist;
  expect(response.result.key).to.eql(key);

  return response.result;
};

const addSubscribersToTopic = async (
  session: UserSession,
  createdTopicDto: TopicResponseDto,
  subscribers: SubscriberEntity[]
) => {
  const subscriberIds: ExternalSubscriberId[] = subscribers.map(
    (subscriber: SubscriberEntity) => subscriber.subscriberId
  );

  const response = await initNovuClassSdk(session).topics.subscriptions.create(
    {
      subscriberIds,
    },
    createdTopicDto.key
  );

  expect(response.result.data).to.be.ok;
};

const buildTriggerRequestPayload = (
  template: NotificationTemplateEntity,
  to: (string | TopicPayloadDto | SubscriberPayloadDto)[],
  attachments?: Record<string, unknown>[]
): TriggerEventRequestDto => {
  return {
    workflowId: template.triggers[0].identifier,
    to,
    payload: {
      firstName: 'Testing of User Name',
      urlVariable: '/test/url/path',
      ...(attachments && { attachments }),
    },
  };
};

const triggerEvent = async (
  session: UserSession,
  template: NotificationTemplateEntity,
  to: (string | TopicPayloadDto | SubscriberPayloadDto)[],
  payload: Record<string, unknown> = {}
): Promise<void> => {
  await initNovuClassSdk(session).trigger({
    workflowId: template.triggers[0].identifier,
    to,
    payload,
  });
};
