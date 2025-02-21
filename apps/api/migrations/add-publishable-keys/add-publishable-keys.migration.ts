/* eslint-disable */
import '../../src/config';

import { EnvironmentRepository } from '@novu/dal';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../src/app.module';

export async function addPublishableKeysMigration() {
  console.log('Start migration - Add publishable keys to environments');

  const app = await NestFactory.create(AppModule, {
    logger: false,
  });

  const environmentRepository = app.get(EnvironmentRepository);
  const environments = await environmentRepository.find({});

  for (const environment of environments) {
    console.log(`Processing environment ${environment._id}`);

    if (environment.publishableKey) {
      console.log(`Environment ${environment._id} already has a publishable key, skipping...`);
      continue;
    }

    const prefix = environment.name === 'Production' ? 'pk_live_' : 'pk_test_';
    const publishableKey = `${prefix}${environment.identifier}`;

    await environmentRepository.update(
      { _id: environment._id },
      {
        $set: { publishableKey },
      }
    );

    console.log(`Updated environment ${environment._id} with publishable key ${publishableKey}`);
  }

  await app.close();
  console.log('End migration');
}
