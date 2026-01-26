import { PreferencesRepository } from '@novu/dal';
import { PreferencesTypeEnum } from '@novu/shared';
import { createHash } from 'crypto';
import { expect } from 'chai';
import { run } from './preferences-context-keys-hash-migration';

function hashContextKeys(contextKeys: string[] | undefined): string | undefined {
  if (!contextKeys || contextKeys.length === 0) {
    return undefined;
  }

  const sorted = [...contextKeys].sort();

  return createHash('sha256').update(JSON.stringify(sorted)).digest('hex').substring(0, 16);
}

describe('Preferences Context Keys Hash Migration', () => {
  let preferencesRepository: PreferencesRepository;

  beforeEach(async () => {
    preferencesRepository = new PreferencesRepository();
  });

  it('should add contextKeysHash to preferences with contextKeys', async () => {
    const contextKeys = ['key1', 'key2'];
    const expectedHash = hashContextKeys(contextKeys);

    const preference = await preferencesRepository.create({
      _environmentId: '123',
      _organizationId: '456',
      _subscriberId: '789',
      type: PreferencesTypeEnum.SUBSCRIBER_GLOBAL,
      preferences: {},
      contextKeys,
    });

    await run();

    const updatedPreference = await preferencesRepository.findById(preference._id);

    expect(updatedPreference?.contextKeysHash).to.equal(expectedHash);
  });

  it('should handle preferences with empty contextKeys array', async () => {
    const preference = await preferencesRepository.create({
      _environmentId: '123',
      _organizationId: '456',
      _subscriberId: '789',
      type: PreferencesTypeEnum.SUBSCRIBER_GLOBAL,
      preferences: {},
      contextKeys: [],
    });

    await run();

    const updatedPreference = await preferencesRepository.findById(preference._id);

    expect(updatedPreference?.contextKeysHash).to.be.undefined;
  });

  it('should handle preferences without contextKeys field', async () => {
    const preference = await preferencesRepository.create({
      _environmentId: '123',
      _organizationId: '456',
      _templateId: '789',
      type: PreferencesTypeEnum.WORKFLOW_RESOURCE,
      preferences: {},
    });

    await run();

    const updatedPreference = await preferencesRepository.findById(preference._id);

    expect(updatedPreference?.contextKeysHash).to.be.undefined;
  });

  it('should generate same hash for same keys in different order', async () => {
    const keys1 = ['key1', 'key2', 'key3'];
    const keys2 = ['key3', 'key1', 'key2'];

    const hash1 = hashContextKeys(keys1);
    const hash2 = hashContextKeys(keys2);

    expect(hash1).to.equal(hash2);
  });
});
