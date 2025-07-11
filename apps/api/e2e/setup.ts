import { DalService } from '@novu/dal';
import { testServer } from '@novu/testing';
import chai from 'chai';
import type { Connection } from 'mongoose';
import sinon from 'sinon';
import { bootstrap } from '../src/bootstrap';

let connection: Connection;
const dalService = new DalService();

async function getConnection() {
  if (!connection) {
    connection = await dalService.connect(process.env.MONGO_URL);
  }

  return connection;
}

async function dropDatabase() {
  try {
    const conn = await getConnection();
    await conn.db.dropDatabase();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error dropping the database:', error);
  }
}

before(async () => {
  /**
   * disable truncating for better error messages - https://www.chaijs.com/guide/styles/#configtruncatethreshold
   */
  chai.config.truncateThreshold = 0;

  await dropDatabase();
  await testServer.create((await bootstrap()).app);
});

after(async () => {
  await testServer.teardown();
  await dropDatabase();
  if (connection) {
    await connection.close();
  }
});

afterEach(async () => {
  sinon.restore();
});
