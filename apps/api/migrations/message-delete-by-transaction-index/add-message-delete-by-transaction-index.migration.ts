import { Message } from '@novu/dal';

/**
 * Supports DELETE /v1/messages/transaction/:transactionId — count, distinct _subscriberId, deleteMany
 * on { _organizationId, _environmentId, transactionId, channel? }.
 */
export async function addMessageDeleteByTransactionIndexMigration(): Promise<void> {
  console.log('start migration - message compound index for delete-by-transactionId');

  await Message.collection.createIndex(
    {
      _organizationId: 1,
      _environmentId: 1,
      transactionId: 1,
      channel: 1,
    },
    {
      name: 'org_env_transactionId_channel_1',
      background: true,
    }
  );

  console.log('end migration - message compound index for delete-by-transactionId');
}
