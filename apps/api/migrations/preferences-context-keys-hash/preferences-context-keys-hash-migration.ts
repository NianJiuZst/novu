import '../../src/config';

import { NestFactory } from '@nestjs/core';
import { PinoLogger } from '@novu/application-generic';
import { PreferencesRepository } from '@novu/dal';
import { createHash } from 'crypto';
import { AppModule } from '../../src/app.module';

function hashContextKeys(contextKeys: string[] | undefined): string | undefined {
  if (!contextKeys || contextKeys.length === 0) {
    return undefined;
  }

  const sorted = [...contextKeys].sort();

  return createHash('sha256').update(JSON.stringify(sorted)).digest('hex').substring(0, 16);
}

export async function run() {
  const app = await NestFactory.create(AppModule, {
    logger: false,
  });

  const logger = await app.resolve(PinoLogger);
  logger.setContext('PreferencesContextKeysHashMigration');
  const preferencesRepository = app.get(PreferencesRepository);

  logger.info('start migration - preferences context keys hash');

  const cursor = await preferencesRepository._model.find({ contextKeys: { $exists: true } }).cursor();

  let updated = 0;
  let skipped = 0;

  for await (const doc of cursor) {
    const hash = hashContextKeys(doc.contextKeys);

    if (hash !== undefined) {
      await preferencesRepository._model.updateOne({ _id: doc._id }, { $set: { contextKeysHash: hash } });
      updated++;
    } else {
      skipped++;
    }

    if ((updated + skipped) % 1000 === 0) {
      logger.info('processed %d documents (%d updated, %d skipped)', updated + skipped, updated, skipped);
    }
  }

  logger.info('end migration - processed %d documents (%d updated, %d skipped)', updated + skipped, updated, skipped);
  await app.close();
}

run()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
