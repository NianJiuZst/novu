import { ClickHouseService, WorkflowRunRepository, WorkflowRunStatusEnum } from '@novu/application-generic';
import { NotificationEntity, NotificationRepository, NotificationTemplateEntity, SubscriberEntity } from '@novu/dal';
import { EmailBlockTypeEnum, StepTypeEnum } from '@novu/shared';
import { SubscribersService, UserSession } from '@novu/testing';
import { expect } from 'chai';
import { WorkflowRunStatusDtoEnum } from '../dtos/shared.dto';
import { GetWorkflowRunsResponseDto } from '../dtos/workflow-runs-response.dto';

describe('Workflow Runs Filtering & Pagination - GET /v1/activity/workflow-runs #novu-v2', () => {
  let session: UserSession;
  let template: NotificationTemplateEntity;
  let inAppWorkflow: NotificationTemplateEntity;
  let emailTemplate: NotificationTemplateEntity;
  let inAppTemplate: NotificationTemplateEntity;
  let subscriber: SubscriberEntity;
  let subscriberService: SubscribersService;
  let workflowRunRepository: WorkflowRunRepository;
  const clickHouseService = new ClickHouseService();

  async function createMultipleWorkflowRunsByDb(options: {
    count: number;
    subscriberId: string[];
    subscriberInternalId?: string;
    workflowTemplate?: NotificationTemplateEntity;
    payloadTemplate?: (index: number) => Record<string, any>;
    transactionId?: string;
    status?: WorkflowRunStatusEnum;
    channels?: StepTypeEnum[];
    baseTimestamp?: number;
    timestampOffsetMs?: number;
  }) {
    const {
      count,
      subscriberId,
      subscriberInternalId,
      workflowTemplate,
      payloadTemplate,
      transactionId,
      status = WorkflowRunStatusEnum.COMPLETED,
      channels = [StepTypeEnum.EMAIL],
      baseTimestamp = Date.now(),
      timestampOffsetMs = 1000,
    } = options;

    const templateToUse = workflowTemplate || template;
    const subscriberIdToUse = subscriberInternalId || subscriber._id;

    const promises: Promise<void>[] = [];

    for (let i = 1; i < count + 1; i += 1) {
      const payload = payloadTemplate ? payloadTemplate(i) : { runNumber: i };
      const recordTimestamp = new Date(baseTimestamp + i * timestampOffsetMs);

      const mockNotification: NotificationEntity = {
        _id: NotificationRepository.createObjectId(),
        _templateId: templateToUse._id,
        _environmentId: session.environment._id,
        _organizationId: session.organization._id,
        _subscriberId: subscriberIdToUse,
        topics: [],
        transactionId: transactionId ? `${transactionId}-${i}` : `txn_${baseTimestamp}_${i}`,
        channels,
        to: subscriberId[0],
        payload,
        controls: undefined,
        tags: [],
        createdAt: recordTimestamp.toISOString(),
      };

      promises.push(
        workflowRunRepository.create(mockNotification, templateToUse, {
          status,
          userId: session.user._id,
          externalSubscriberId: subscriberId[0],
        })
      );
    }

    await Promise.all(promises);
  }

  beforeEach(async () => {
    await clickHouseService.init();

    // Enable workflow run logs writing for testing
    (process.env as any).IS_WORKFLOW_RUN_LOGS_WRITE_ENABLED = 'true';

    session = new UserSession();
    await session.initialize();
    subscriberService = new SubscribersService(session.organization._id, session.environment._id);
    subscriber = await subscriberService.createSubscriber();
    workflowRunRepository = session.testServer?.getService(WorkflowRunRepository);

    template = await session.createTemplate({
      steps: [
        {
          type: StepTypeEnum.EMAIL,
          subject: 'Test subject',
          content: [{ type: EmailBlockTypeEnum.TEXT, content: 'Hello {{firstName}}' }],
        },
      ],
    });

    inAppWorkflow = await session.createTemplate({
      name: 'In App Workflow',
      steps: [
        {
          type: StepTypeEnum.IN_APP,
          content: 'In-app notification content {{firstName}}',
        },
      ],
    });

    emailTemplate = await session.createTemplate({
      steps: [
        {
          type: StepTypeEnum.EMAIL,
          subject: 'Email workflow subject',
          content: [{ type: EmailBlockTypeEnum.TEXT, content: 'Email workflow content {{firstName}}' }],
        },
      ],
    });

    inAppTemplate = await session.createTemplate({
      steps: [
        {
          type: StepTypeEnum.IN_APP,
          content: 'In-app notification content {{firstName}}',
        },
      ],
    });
  });

  afterEach(() => {
    // Clean up environment variable after each test
    delete (process.env as any).IS_WORKFLOW_RUN_LOGS_WRITE_ENABLED;
  });

  it('should return paginated results with default limit', async () => {
    await createMultipleWorkflowRunsByDb({
      count: 12,
      subscriberId: [subscriber.subscriberId],
    });

    const { body: firstPage }: { body: GetWorkflowRunsResponseDto } = await session.testAgent
      .get('/v1/activity/workflow-runs')
      .expect(200);

    expect(firstPage.next, 'firstPage next').to.be.not.null;
    expect(firstPage.previous, 'firstPage previous').to.be.null;
    expect(firstPage.data.length, 'firstPage dataLength').to.be.equal(10);

    const { body: secondPage }: { body: GetWorkflowRunsResponseDto } = await session.testAgent
      .get('/v1/activity/workflow-runs')
      .query({ cursor: firstPage.next })
      .expect(200);

    expect(secondPage.next, 'secondPage next').to.be.null;
    expect(secondPage.previous, 'secondPage previous').to.be.not.null;
    expect(secondPage.data.length, 'secondPage dataLength').to.be.equal(2);

    const secondPageFirstWorkflowRun = await workflowRunRepository.findOne({
      where: {
        enforced: { environmentId: session.environment._id },
        conditions: [{ field: 'workflow_run_id', operator: '=', value: secondPage.data[0].id }],
      },
      select: '*',
    });
    expect(secondPageFirstWorkflowRun, 'secondPageFirstWorkflowRun should exist').to.not.be.null;
    expect(secondPageFirstWorkflowRun.data, 'secondPageFirstWorkflowRun.data should exist').to.not.be.undefined;
    expect(
      JSON.parse(secondPageFirstWorkflowRun.data.payload || '{}')?.runNumber,
      'secondPage first item runNumber (descending order)'
    ).to.be.equal(2);

    const secondPageLastWorkflowRun = await workflowRunRepository.findOne({
      where: {
        enforced: { environmentId: session.environment._id },
        conditions: [{ field: 'workflow_run_id', operator: '=', value: secondPage.data[1].id }],
      },
      select: '*',
    });
    expect(secondPageLastWorkflowRun, 'secondPageLastWorkflowRun should exist').to.not.be.null;
    expect(secondPageLastWorkflowRun.data, 'secondPageLastWorkflowRun.data should exist').to.not.be.undefined;
    expect(
      JSON.parse(secondPageLastWorkflowRun.data.payload || '{}')?.runNumber,
      'secondPage last item runNumber (oldest item)'
    ).to.be.equal(1);

    expect(firstPage.data[0].steps, 'workflow run should have steps').to.be.an('array');
  });

  it('should validate cursor-based pagination collision handling', async () => {
    await createMultipleWorkflowRunsByDb({
      count: 11,
      subscriberId: [subscriber.subscriberId],
    });

    const fetchedRunNumbers = new Set<number>();
    const forwardPages: Array<{
      pageNumber: number;
      orderedIds: string[];
      transactionIds: string[];
      next: string | null;
      previous: string | null;
    }> = [];
    let cursor: string | null = null;
    let totalFetched = 0;
    let pageCount = 0;

    // Go forward through all pages and store detailed page information
    do {
      const query: any = { limit: 2 };
      if (cursor) {
        query.cursor = cursor;
      }

      const { body } = await session.testAgent.get('/v1/activity/workflow-runs').query(query).expect(200);

      pageCount += 1;
      const currentPageNumber = pageCount;

      // Store page data with ordered IDs for later comparison
      const orderedIds = body.data.map((item: any) => item.id);
      const transactionIds = body.data.map((item: any) => item.transactionId);
      forwardPages.push({
        pageNumber: currentPageNumber,
        orderedIds,
        transactionIds,
        next: body.next,
        previous: body.previous,
      });

      expect(body.data).to.be.an('array');
      expect(body.data.length).to.be.at.least(1);
      expect(body.data.length).to.be.at.most(2);

      // Check for duplicates and collect runNumbers
      for (const workflowRun of body.data) {
        const workflowRunEntity = await workflowRunRepository.findOne({
          where: {
            enforced: { environmentId: session.environment._id },
            conditions: [{ field: 'workflow_run_id', operator: '=', value: workflowRun.id }],
          },
          select: '*',
        });
        expect(workflowRunEntity, 'workflowRunEntity should exist').to.not.be.null;
        expect(workflowRunEntity.data, 'workflowRunEntity.data should exist').to.not.be.undefined;
        const runNumber = JSON.parse(workflowRunEntity.data.payload || '{}')?.runNumber;
        expect(fetchedRunNumbers.has(runNumber), `Duplicate runNumber ${runNumber} found on page ${currentPageNumber}`)
          .to.be.false;
        fetchedRunNumbers.add(runNumber);
      }

      totalFetched += body.data.length;
      cursor = body.next;

      // Validate cursor logic - next indicates if there are more results
      if (cursor) {
        expect(cursor, `next should be a valid string when there are more results on page ${pageCount}`).to.be.a(
          'string'
        );
      } else {
        expect(cursor, `next should be null when there are no more results on page ${pageCount}`).to.be.null;
      }
    } while (cursor);

    // Validate we fetched all 11 workflow runs
    expect(totalFetched, 'Total fetched workflow runs').to.equal(11);
    expect(fetchedRunNumbers.size, 'Unique runNumbers fetched').to.equal(11);

    // Validate we have runNumbers 1 through 11
    for (let i = 1; i <= 11; i += 1) {
      expect(fetchedRunNumbers.has(i), `runNumber ${i} should be present`).to.be.true;
    }

    // Test bidirectional pagination: Navigate backwards through ALL pages
    const lastPage = forwardPages[forwardPages.length - 1];
    expect(lastPage.previous, 'Last page should have previous').to.be.not.null;

    // Navigate backwards through all pages and validate they match forward pages exactly
    let backwardCursor = lastPage.previous;
    let backwardPageIndex = forwardPages.length - 2; // Start from second-to-last page

    while (backwardCursor && backwardPageIndex >= 0) {
      const { body: backwardPageResult } = await session.testAgent
        .get('/v1/activity/workflow-runs')
        .query({ cursor: backwardCursor, limit: 2 })
        .expect(200);

      const correspondingForwardPage = forwardPages[backwardPageIndex];
      const backwardOrderedIds = backwardPageResult.data.map((item: any) => item.id);

      // Validate exact same items in exact same order
      expect(backwardPageResult.data.length, `Backward page ${backwardPageIndex + 1} should have same length`).to.equal(
        correspondingForwardPage.orderedIds.length
      );

      expect(
        backwardOrderedIds,
        `Backward page ${backwardPageIndex + 1} IDs should match forward page exactly`
      ).to.deep.equal(correspondingForwardPage.orderedIds);

      // Validate runNumbers match in exact order (no sorting, preserve original order)
      const backwardRunNumbers = backwardPageResult.data.map((item: any) => item.transactionId);
      const forwardRunNumbers = correspondingForwardPage.transactionIds;

      expect(
        backwardRunNumbers,
        `Backward page ${backwardPageIndex + 1} runNumbers should match forward page order`
      ).to.deep.equal(forwardRunNumbers);

      // Validate cursor properties
      if (backwardPageIndex > 0) {
        expect(backwardPageResult.previous, `Backward page ${backwardPageIndex + 1} should have previous`).to.be.not
          .null;
      } else {
        expect(backwardPageResult.previous, `First page (backward) should have null previous`).to.be.null;
      }

      expect(backwardPageResult.next, `Backward page ${backwardPageIndex + 1} should have next`).to.be.not.null;

      // Move to previous page
      backwardCursor = backwardPageResult.previous;
      backwardPageIndex -= 1;
    }

    // Validate we reached the beginning (first page should have null previous)
    expect(backwardPageIndex, 'Should have navigated through all pages backwards').to.equal(-1);

    /*
     * Test that we can navigate forward again from any backward page
     * Test from the middle page for comprehensive validation
     */
    const middlePageIndex = Math.floor(forwardPages.length / 2);
    const middlePage = forwardPages[middlePageIndex];

    if (middlePage.next) {
      const { body: forwardFromMiddleResult } = await session.testAgent
        .get('/v1/activity/workflow-runs')
        .query({ cursor: middlePage.next, limit: 2 })
        .expect(200);

      const nextPageFromMiddle = forwardPages[middlePageIndex + 1];
      const forwardFromMiddleIds = forwardFromMiddleResult.data.map((item: any) => item.id);

      expect(forwardFromMiddleIds, 'Forward navigation from middle should match original forward page').to.deep.equal(
        nextPageFromMiddle.orderedIds
      );
    }
  });

  it('should filter results by single workflowId', async () => {
    const secondTemplate = await session.createTemplate({
      steps: [{ type: StepTypeEnum.IN_APP, content: 'Test in-app message' }],
    });

    await createMultipleWorkflowRunsByDb({
      count: 1,
      subscriberId: [subscriber.subscriberId],
      workflowTemplate: template,
    });

    await createMultipleWorkflowRunsByDb({
      count: 1,
      subscriberId: [subscriber.subscriberId],
      workflowTemplate: secondTemplate,
      channels: [StepTypeEnum.IN_APP],
    });

    const { body } = await session.testAgent
      .get('/v1/activity/workflow-runs')
      .query({ workflowIds: [template._id] })
      .expect(200);

    expect(body.data).to.be.an('array');
    expect(body.data.length).to.be.greaterThan(0);

    for (const workflowRun of body.data) {
      expect(workflowRun.workflowId).to.equal(template._id);
      expect(workflowRun.steps, 'workflow run should have steps').to.be.an('array');
    }
  });

  it('should filter results by multiple workflowIds', async () => {
    const secondTemplate = await session.createTemplate({
      steps: [{ type: StepTypeEnum.IN_APP, content: 'Test in-app message' }],
    });

    await createMultipleWorkflowRunsByDb({
      count: 1,
      subscriberId: [subscriber.subscriberId],
      workflowTemplate: template,
    });

    await createMultipleWorkflowRunsByDb({
      count: 1,
      subscriberId: [subscriber.subscriberId],
      workflowTemplate: secondTemplate,
      channels: [StepTypeEnum.IN_APP],
    });

    const { body } = await session.testAgent
      .get('/v1/activity/workflow-runs')
      .query({ workflowIds: [template._id, secondTemplate._id] })
      .expect(200);

    expect(body.data).to.be.an('array');
    expect(body.data.length).to.equal(2);

    const allowedIds = [template._id, secondTemplate._id];
    for (const workflowRun of body.data) {
      expect(allowedIds).to.include(workflowRun.workflowId);
    }
  });

  it('should filter results by single subscriberId', async () => {
    const secondSubscriber = await subscriberService.createSubscriber();

    await createMultipleWorkflowRunsByDb({
      count: 1,
      subscriberId: [subscriber.subscriberId],
      subscriberInternalId: subscriber._id,
    });

    await createMultipleWorkflowRunsByDb({
      count: 1,
      subscriberId: [secondSubscriber.subscriberId],
      subscriberInternalId: secondSubscriber._id,
    });

    const { body } = await session.testAgent
      .get('/v1/activity/workflow-runs')
      .query({ subscriberIds: [subscriber.subscriberId] })
      .expect(200);

    expect(body.data).to.be.an('array');
    expect(body.data.length).to.be.greaterThan(0);

    for (const workflowRun of body.data) {
      expect(workflowRun.subscriberId).to.equal(subscriber.subscriberId);
    }
  });

  it('should filter results by transactionId', async () => {
    const customTransactionId = `test-transaction-${Date.now()}`;

    await createMultipleWorkflowRunsByDb({
      count: 1,
      subscriberId: [subscriber.subscriberId],
      transactionId: customTransactionId,
    });

    await createMultipleWorkflowRunsByDb({
      count: 1,
      subscriberId: [subscriber.subscriberId],
    });

    const { body } = await session.testAgent
      .get('/v1/activity/workflow-runs')
      .query({ transactionIds: [`${customTransactionId}-1`] })
      .expect(200);

    expect(body.data).to.be.an('array');
    expect(body.data.length).to.equal(1);

    for (const workflowRun of body.data) {
      expect(workflowRun.transactionId).to.equal(`${customTransactionId}-1`);
    }
  });

  it('should filter results by status', async () => {
    await createMultipleWorkflowRunsByDb({
      count: 2,
      subscriberId: [subscriber.subscriberId],
      status: WorkflowRunStatusEnum.COMPLETED,
    });
    await createMultipleWorkflowRunsByDb({
      count: 1,
      subscriberId: [subscriber.subscriberId],
      status: WorkflowRunStatusEnum.ERROR,
    });

    const { body } = await session.testAgent
      .get('/v1/activity/workflow-runs')
      .query({ statuses: [WorkflowRunStatusDtoEnum.COMPLETED] })
      .expect(200);

    expect(body.data.length).to.be.equal(2);

    for (const workflowRun of body.data) {
      expect(workflowRun.status).to.equal(WorkflowRunStatusDtoEnum.COMPLETED);
    }
  });

  it('should filter results by date range', async () => {
    const now = Date.now();
    const firstBatchBaseTime = now - 60000;
    const secondBatchBaseTime = now - 30000;
    const thirdBatchBaseTime = now;

    await createMultipleWorkflowRunsByDb({
      count: 2,
      subscriberId: [subscriber.subscriberId],
      payloadTemplate: (index) => ({ testText: `first trigger ${index}` }),
      baseTimestamp: firstBatchBaseTime,
      timestampOffsetMs: 100,
    });

    await createMultipleWorkflowRunsByDb({
      count: 2,
      subscriberId: [subscriber.subscriberId],
      payloadTemplate: (index) => ({ testText: `second trigger ${index}` }),
      baseTimestamp: secondBatchBaseTime,
      timestampOffsetMs: 100,
    });

    await createMultipleWorkflowRunsByDb({
      count: 2,
      subscriberId: [subscriber.subscriberId],
      payloadTemplate: (index) => ({ testText: `third trigger ${index}` }),
      baseTimestamp: thirdBatchBaseTime,
      timestampOffsetMs: 100,
    });

    const beforeSecondBatch = new Date(now - 45000);
    const afterSecondBatch = new Date(now - 15000);

    const { body } = await session.testAgent
      .get('/v1/activity/workflow-runs')
      .query({
        createdGte: beforeSecondBatch.toISOString(),
        createdLte: afterSecondBatch.toISOString(),
      })
      .expect(200);

    expect(body.data).to.be.an('array');
    expect(body.data.length, 'body.data.length').to.equal(2);

    for (const workflowRun of body.data) {
      const workflowRunEntity = await workflowRunRepository.findOne({
        where: {
          enforced: { environmentId: session.environment._id },
          conditions: [{ field: 'workflow_run_id', operator: '=', value: workflowRun.id }],
        },
        select: '*',
      });
      expect(workflowRunEntity, 'workflowRunEntity should exist').to.not.be.null;
      expect(workflowRunEntity.data, 'workflowRunEntity.data should exist').to.not.be.undefined;
      expect(JSON.parse(workflowRunEntity.data.payload || '{}')?.testText).to.contain('second trigger');
    }
  });

  it('should support combining multiple filters', async () => {
    await createMultipleWorkflowRunsByDb({
      count: 1,
      subscriberId: [subscriber.subscriberId],
      workflowTemplate: inAppWorkflow,
      channels: [StepTypeEnum.IN_APP],
      status: WorkflowRunStatusEnum.COMPLETED,
    });

    const { body } = await session.testAgent
      .get('/v1/activity/workflow-runs')
      .query({
        workflowIds: [inAppWorkflow._id],
        subscriberIds: subscriber.subscriberId,
        statuses: [WorkflowRunStatusDtoEnum.COMPLETED],
        limit: 10,
      })
      .expect(200);

    expect(body.data.length, 'expected body.data.length to be greater than 0').to.be.greaterThan(0);

    for (const workflowRun of body.data) {
      expect(workflowRun.workflowId).to.equal(inAppWorkflow._id);
      expect(workflowRun.subscriberId).to.equal(subscriber.subscriberId);
      expect(workflowRun.status).to.equal(WorkflowRunStatusDtoEnum.COMPLETED);
    }
  });

  it('should filter results by channels', async () => {
    await createMultipleWorkflowRunsByDb({
      count: 2,
      subscriberId: [subscriber.subscriberId],
      workflowTemplate: emailTemplate,
      channels: [StepTypeEnum.EMAIL],
    });

    await createMultipleWorkflowRunsByDb({
      count: 2,
      subscriberId: [subscriber.subscriberId],
      workflowTemplate: inAppTemplate,
      channels: [StepTypeEnum.IN_APP],
    });

    const { body: bodyEmailFiltered } = (await session.testAgent
      .get('/v1/activity/workflow-runs')
      .query({ channels: [StepTypeEnum.EMAIL] })
      .expect(200)) as { body: GetWorkflowRunsResponseDto };

    expect(bodyEmailFiltered.data.length, 'bodyEmailFiltered.data.length').to.be.greaterThan(0);

    for (const workflowRun of bodyEmailFiltered.data) {
      expect(workflowRun.workflowId).to.equal(emailTemplate._id);
    }

    const { body: bodyEmailAndInAppFiltered } = (await session.testAgent
      .get('/v1/activity/workflow-runs')
      .query({ channels: [StepTypeEnum.EMAIL, StepTypeEnum.IN_APP] })
      .expect(200)) as { body: GetWorkflowRunsResponseDto };

    expect(bodyEmailAndInAppFiltered.data.length, 'bodyEmailAndInAppFiltered.data.length').to.equal(4);
  });

  it('should handle empty results gracefully', async () => {
    const { body } = await session.testAgent
      .get('/v1/activity/workflow-runs')
      .query({ workflowIds: ['non-existent-id'] })
      .expect(200);

    expect(body.data).to.be.an('array');
    expect(body.data.length).to.equal(0);
    expect(body.next).to.equal(null);
    expect(body.previous).to.equal(null);
  });
});
