import { expect } from 'chai';
import { safeExtractErrorMessage, safeStringifyError } from './safe-stringify-error';

describe('safeStringifyError', () => {
  it('should stringify a plain object', () => {
    const result = safeStringifyError({ message: 'test', code: 123 });
    expect(result).to.equal('{"message":"test","code":123}');
  });

  it('should handle circular references gracefully', () => {
    const obj: any = { message: 'circular test' };
    obj.self = obj;

    const result = safeStringifyError(obj);
    expect(result).to.be.a('string');
    expect(result).to.include('circular test');
  });

  it('should handle a standard Error object', () => {
    const error = new Error('something broke');
    const result = safeStringifyError(error);
    expect(result).to.be.a('string');
  });

  it('should handle an Axios-like error with circular socket', () => {
    const socket: any = { writable: true };
    socket._parent = socket;
    const axiosError: any = {
      message: 'Request failed with status code 500',
      name: 'AxiosError',
      code: 'ERR_BAD_RESPONSE',
      response: { status: 500, data: { error: 'Internal Server Error' } },
      request: { socket },
    };
    axiosError.request.socket._parent = axiosError.request;

    const result = safeStringifyError(axiosError);
    expect(result).to.be.a('string');
    expect(result).to.include('Request failed with status code 500');
    expect(result).to.include('500');
  });

  it('should return empty string for falsy input', () => {
    expect(safeStringifyError(null)).to.equal('null');
    expect(safeStringifyError(undefined)).to.equal(undefined);
  });
});

describe('safeExtractErrorMessage', () => {
  it('should extract message from JSON-encoded error message', () => {
    const error = { message: JSON.stringify({ message: 'inner error' }) };
    const result = safeExtractErrorMessage(error);
    expect(result).to.equal('inner error');
  });

  it('should return plain error message when not JSON', () => {
    const error = new Error('plain error');
    const result = safeExtractErrorMessage(error);
    expect(result).to.equal('plain error');
  });

  it('should handle null/undefined errors', () => {
    expect(safeExtractErrorMessage(null)).to.be.a('string');
    expect(safeExtractErrorMessage(undefined)).to.be.a('string');
  });

  it('should handle string errors', () => {
    const result = safeExtractErrorMessage('just a string');
    expect(result).to.equal('just a string');
  });

  it('should handle JSON-encoded message without inner message field', () => {
    const error = { message: JSON.stringify({ code: 'ERR_TIMEOUT' }) };
    const result = safeExtractErrorMessage(error);
    expect(result).to.equal(error.message);
  });
});
