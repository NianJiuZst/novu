import { EmailBlockTypeEnum, PreferenceLevelEnum, StepTypeEnum } from '@novu/shared';
import { UserSession } from '@novu/testing';
import { expect } from 'chai';

describe('AI Preferences - /inbox/preferences (PATCH) #novu-v2', function () {
  let session: UserSession;

  beforeEach(async () => {
    session = new UserSession();
    await session.initialize();
  });

  it('should update global preferences with AI preference', async function () {
    const response = await session.testAgent
      .patch('/v1/inbox/preferences')
      .send({
        email: true,
        in_app: true,
        aiPreference: {
          enabled: true,
          prompt: 'Only notify me about urgent messages',
        },
      })
      .set('Authorization', `Bearer ${session.subscriberToken}`);

    expect(response.status).to.equal(200);
    expect(response.body.data.level).to.equal(PreferenceLevelEnum.GLOBAL);
    expect(response.body.data.aiPreference).to.exist;
    expect(response.body.data.aiPreference.enabled).to.equal(true);
    expect(response.body.data.aiPreference.prompt).to.equal('Only notify me about urgent messages');
  });

  it('should update workflow preferences with AI preference', async function () {
    const workflow = await session.createTemplate({
      noFeedId: true,
      steps: [
        {
          type: StepTypeEnum.IN_APP,
          content: 'Test notification content',
        },
      ],
    });

    const response = await session.testAgent
      .patch(`/v1/inbox/preferences/${workflow._id}`)
      .send({
        email: true,
        in_app: false,
        aiPreference: {
          enabled: true,
          prompt: 'Only send me notifications about critical issues',
        },
      })
      .set('Authorization', `Bearer ${session.subscriberToken}`);

    expect(response.status).to.equal(200);
    expect(response.body.data.level).to.equal(PreferenceLevelEnum.TEMPLATE);
    expect(response.body.data.aiPreference).to.exist;
    expect(response.body.data.aiPreference.enabled).to.equal(true);
    expect(response.body.data.aiPreference.prompt).to.equal('Only send me notifications about critical issues');
  });

  it('should retrieve preferences with AI preference included', async function () {
    // First, set a preference with AI
    await session.testAgent
      .patch('/v1/inbox/preferences')
      .send({
        email: true,
        aiPreference: {
          enabled: true,
          prompt: 'Test AI prompt',
        },
      })
      .set('Authorization', `Bearer ${session.subscriberToken}`);

    // Then retrieve all preferences
    const response = await session.testAgent
      .get('/v1/inbox/preferences')
      .set('Authorization', `Bearer ${session.subscriberToken}`);

    expect(response.status).to.equal(200);
    const globalPreference = response.body.data.find((pref) => pref.level === PreferenceLevelEnum.GLOBAL);
    expect(globalPreference).to.exist;
    expect(globalPreference.aiPreference).to.exist;
    expect(globalPreference.aiPreference.enabled).to.equal(true);
    expect(globalPreference.aiPreference.prompt).to.equal('Test AI prompt');
  });
});
