// noinspection ExceptionCaughtLocallyJS

import { BaseCommand, CommandValidationException } from '@novu/application-generic';
import { expect } from 'chai';
import { IsNotEmpty } from './chat-oauth-callback.command';

class IsNotEmptyNameCommand extends BaseCommand {
  name?: string;
}

IsNotEmpty()(IsNotEmptyNameCommand.prototype, 'name');

class NameCommand extends BaseCommand {
  name: string;
}

function assertCommandValidationError(e: CommandValidationException, fieldName: string, fieldMsg: string) {
  if (!(e instanceof CommandValidationException)) {
    throw new Error(e);
  }
  if (!e.constraintsViolated) {
    throw e;
  }
  expect(e.constraintsViolated[fieldName].messages[0]).to.equal(fieldMsg);
}

describe('@IsNotEmpty() validator', () => {
  it('should create command with string name', async () => {
    const validateNameCommand = IsNotEmptyNameCommand.create({ name: 'mike' });

    expect(validateNameCommand.name).to.equal('mike');
  });

  it('should throw exception on string null', async () => {
    NameCommand.create({ name: 'null' } as any);

    try {
      IsNotEmptyNameCommand.create({ name: 'null' } as any);
      throw new Error('should not have passed validation');
    } catch (e) {
      assertCommandValidationError(e, 'name', 'name should not be null');
    }
  });

  it('should throw exception on undefined', async () => {
    NameCommand.create({ name: undefined } as any);

    try {
      IsNotEmptyNameCommand.create({ name: undefined } as any);
      throw new Error('should not have passed validation');
    } catch (e) {
      assertCommandValidationError(e, 'name', 'name should not be undefined');
    }
  });

  it('should throw exception on undefined null', async () => {
    NameCommand.create({ name: 'undefined' } as any);

    try {
      IsNotEmptyNameCommand.create({ name: 'undefined' } as any);
      throw new Error('should not have passed validation');
    } catch (e) {
      assertCommandValidationError(e, 'name', 'name should not be undefined');
    }
  });

  it('should throw exception on empty string', async () => {
    NameCommand.create({ name: '' });

    try {
      IsNotEmptyNameCommand.create({ name: '' });
      throw new Error('should not have passed validation');
    } catch (e) {
      assertCommandValidationError(e, 'name', 'name should not be empty string');
    }
  });
});
