import { expect } from 'chai';
import { faker } from '@faker-js/faker';
import { UserSession } from '@novu/testing';
import { EnvironmentRepository } from '@novu/dal';

import { addPublishableKeysMigration } from './add-publishable-keys.migration';

async function pruneEnvironments({ environmentRepository }: { environmentRepository: EnvironmentRepository }) {
  const environments = await environmentRepository.find({});
  for (const env of environments) {
    await environmentRepository.delete({ _id: env._id });
  }
}

describe('Add Publishable Keys Migration', function () {
  let session: UserSession;
  const environmentRepository = new EnvironmentRepository();

  beforeEach(async () => {
    session = new UserSession();
    await session.initialize();
  });

  it('should add publishable keys to environments without them', async function () {
    await pruneEnvironments({ environmentRepository });

    // Create test environments
    const prodEnv = await environmentRepository.create({
      name: 'Production',
      identifier: 'prod-123',
      _organizationId: session.organization._id,
    });

    const devEnv = await environmentRepository.create({
      name: 'Development',
      identifier: 'dev-123',
      _organizationId: session.organization._id,
    });

    await addPublishableKeysMigration();

    const updatedProdEnv = await environmentRepository.findOne({ _id: prodEnv._id });
    const updatedDevEnv = await environmentRepository.findOne({ _id: devEnv._id });

    expect(updatedProdEnv?.publishableKey).to.equal('pk_live_prod-123');
    expect(updatedDevEnv?.publishableKey).to.equal('pk_test_dev-123');
  });

  it('should not modify environments that already have publishable keys', async function () {
    await pruneEnvironments({ environmentRepository });

    const existingEnv = await environmentRepository.create({
      name: 'Production',
      identifier: 'existing-123',
      _organizationId: session.organization._id,
      publishableKey: 'existing-key',
    });

    await addPublishableKeysMigration();

    const updatedEnv = await environmentRepository.findOne({ _id: existingEnv._id });
    expect(updatedEnv?.publishableKey).to.equal('existing-key');
  });

  it('should validate migration idempotence', async function () {
    await pruneEnvironments({ environmentRepository });

    await environmentRepository.create({
      name: 'Production',
      identifier: 'prod-123',
      _organizationId: session.organization._id,
    });

    await addPublishableKeysMigration();
    const firstMigrationExecution = await environmentRepository.find({});

    await addPublishableKeysMigration();
    const secondMigrationExecution = await environmentRepository.find({});

    expect(firstMigrationExecution[0].publishableKey).to.equal(secondMigrationExecution[0].publishableKey);
  });
});
