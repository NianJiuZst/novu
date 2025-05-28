import { expect } from 'chai';
import { MessageRepository, NotificationRepository, NotificationTemplateEntity, SubscriberEntity } from '@novu/dal';
import { SubscribersService, UserSession } from '@novu/testing';
import { ChannelTypeEnum, StepTypeEnum } from '@novu/shared';
import { Novu } from '@novu/api';
import { triggerBulk } from '@novu/api/funcs/triggerBulk';
import { TriggerEventRequestDto } from '@novu/api/models/components';
import { z } from 'zod';
import { expectSdkValidationExceptionGeneric, initNovuClassSdk } from '../../shared/helpers/e2e/sdk/e2e-sdk.helper';

describe('Trigger bulk events - /v1/events/trigger/bulk (POST) #novu-v2', function () {
  let session: UserSession;
  let template: NotificationTemplateEntity;
  let secondTemplate: NotificationTemplateEntity;
  let subscriber: SubscriberEntity;
  let secondSubscriber: SubscriberEntity;
  let subscriberService: SubscribersService;
  const notificationRepository = new NotificationRepository();
  const messageRepository = new MessageRepository();
  let novuClient: Novu;

  beforeEach(async () => {
    session = new UserSession();
    await session.initialize();
    template = await session.createTemplate();
    secondTemplate = await session.createTemplate({
      steps: [
        {
          type: StepTypeEnum.SMS,
          content: 'Hello {{firstName}}',
        },
      ],
    });
    subscriberService = new SubscribersService(session.organization._id, session.environment._id);
    subscriber = await subscriberService.createSubscriber();
    secondSubscriber = await subscriberService.createSubscriber();
    novuClient = initNovuClassSdk(session);
  });

  it('should generate message and notification based on a bulk event', async function () {
    await novuClient.triggerBulk({
      events: [
        {
          workflowId: template.triggers[0].identifier,
          to: [
            {
              subscriberId: subscriber.subscriberId,
            },
          ],
          payload: {
            firstName: 'Testing of User Name',
            urlVar: '/test/url/path',
          },
        },
        {
          workflowId: secondTemplate.triggers[0].identifier,
          to: [
            {
              subscriberId: secondSubscriber.subscriberId,
            },
          ],
          payload: {
            firstName: 'This is a second template',
          },
        },
      ],
    });

    await session.waitForJobCompletion(template._id);
    await session.waitForJobCompletion(secondTemplate._id);

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
    expect(message.payload.urlVar).to.equal('/test/url/path');
    expect(message.payload.attachments).to.be.not.ok;

    const emails = await messageRepository.findBySubscriberChannel(
      session.environment._id,
      subscriber._id,
      ChannelTypeEnum.EMAIL
    );

    expect(emails.length).to.equal(1);
    const email = emails[0];

    expect(email.channel).to.equal(ChannelTypeEnum.EMAIL);

    // Validate second template execution
    const otherSubscriberSms = await messageRepository.findBySubscriberChannel(
      session.environment._id,
      subscriber._id,
      ChannelTypeEnum.SMS
    );
    expect(otherSubscriberSms.length).to.equal(0);

    const sms = await messageRepository.findBySubscriberChannel(
      session.environment._id,
      secondSubscriber._id,
      ChannelTypeEnum.SMS
    );

    expect(sms.length).to.equal(1);

    const smsMessage = sms[0];
    expect(smsMessage.content).to.equal(`Hello This is a second template`);

    const secondSubscriberNotifications = await notificationRepository.findBySubscriberId(
      session.environment._id,
      secondSubscriber._id
    );
    expect(secondSubscriberNotifications.length).to.equal(1);

    const secondSubscriberNotification = secondSubscriberNotifications[0];

    expect(secondSubscriberNotification._organizationId).to.equal(session.organization._id);
    expect(secondSubscriberNotification._templateId).to.equal(secondTemplate._id);
  });

  it('should throw an error when sending more than 100 events', async function () {
    const event: TriggerEventRequestDto = {
      transactionId: '2222',
      workflowId: template.triggers[0].identifier,
      to: [subscriber.subscriberId],
      payload: {
        firstName: 'Testing of User Name',
        urlVariable: '/test/url/path',
      },
    };

    const { error: errorDto } = await expectSdkValidationExceptionGeneric(() =>
      novuClient.triggerBulk({
        events: Array.from({ length: 101 }, () => event),
      })
    );

    expect(errorDto?.statusCode).to.equal(422);
    expect(errorDto?.errors.events.messages[0]).to.equal('events must contain no more than 100 elements');
  });
});
