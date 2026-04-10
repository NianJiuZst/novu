import { expect } from 'chai';
import { safeJsonStringifyForLog } from './safe-json-stringify.util';

describe('safeJsonStringifyForLog', () => {
  it('returns empty string for undefined', () => {
    expect(safeJsonStringifyForLog(undefined)).to.equal('');
  });

  it('stringifies plain objects', () => {
    expect(safeJsonStringifyForLog({ a: 1 })).to.equal('{"a":1}');
  });

  it('replaces circular references without throwing', () => {
    const circular: Record<string, unknown> = { name: 'root' };
    circular.self = circular;

    const result = safeJsonStringifyForLog(circular);

    expect(result).to.include('"name":"root"');
    expect(result).to.include('[Circular]');
  });

  it('serializes nested circular graphs like TLSSocket/request chains without throwing', () => {
    const socket: Record<string, unknown> = {};
    socket.parser = { socket };
    const err = {
      message: 'Request failed',
      isAxiosError: true,
      response: { status: 502, request: { socket } },
    };

    expect(() => JSON.stringify(err)).to.throw();

    const result = safeJsonStringifyForLog(err);

    expect(result).to.include('Request failed');
    expect(result).to.include('[Circular]');
  });
});
