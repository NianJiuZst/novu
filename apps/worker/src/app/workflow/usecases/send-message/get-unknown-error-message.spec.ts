import { expect } from 'chai';
import { getUnknownErrorMessage } from './get-unknown-error-message';

describe('getUnknownErrorMessage', () => {
  it('returns message for Error instances', () => {
    expect(getUnknownErrorMessage(new Error('integration failed'))).to.equal('integration failed');
  });

  it('returns the string when the thrown value is a string', () => {
    expect(getUnknownErrorMessage('plain string failure')).to.equal('plain string failure');
  });

  it('returns message from object-shaped throws (e.g. axios-style)', () => {
    expect(getUnknownErrorMessage({ message: 'timeout', code: 'ETIMEDOUT' })).to.equal('timeout');
  });

  it('stringifies null and undefined', () => {
    expect(getUnknownErrorMessage(null)).to.equal('null');
    expect(getUnknownErrorMessage(undefined)).to.equal('undefined');
  });
});
