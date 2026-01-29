import apn from '@parse/node-apn';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { APNSPushProvider } from './apns.provider';

describe('APNSPushProvider', () => {
  test('should trigger apns library correctly', async () => {
    const mockSend = vi.fn(() => {
      return {
        failed: [],
        sent: [
          {
            device: 'device',
          },
        ],
      };
    });
    const mockShutdown = vi.fn();

    vi.spyOn(apn as any, 'Provider').mockImplementation(() => {
      return {
        send: mockSend,
        shutdown: mockShutdown,
      };
    });

    const provider = new APNSPushProvider({
      key: 'key',
      keyId: 'keyId',
      teamId: 'teamId',
      bundleId: 'bundleId',
      production: true,
    });

    await provider.sendMessage({
      target: ['target'],
      title: 'title',
      content: 'content',
      payload: {
        data: 'data',
      },
      step: {
        digest: false,
        events: undefined,
        total_count: undefined,
      },
      subscriber: {},
    });

    expect(mockSend).toHaveBeenCalledWith(
      {
        encoding: 'utf8',
        payload: { data: 'data' },
        compiled: false,
        aps: {
          alert: {
            body: 'content',
            title: 'title',
          },
        },
        expiry: -1,
        priority: 10,
        topic: 'bundleId',
      },
      ['target']
    );
    expect(mockShutdown).toHaveBeenCalled();
  });

  test('should trigger apns library correctly with _passthrough', async () => {
    const mockSend = vi.fn(() => {
      return {
        failed: [],
        sent: [
          {
            device: 'device',
          },
        ],
      };
    });
    const mockShutdown = vi.fn();

    vi.spyOn(apn as any, 'Provider').mockImplementation(() => {
      return {
        send: mockSend,
        shutdown: mockShutdown,
      };
    });

    const provider = new APNSPushProvider({
      key: 'key',
      keyId: 'keyId',
      teamId: 'teamId',
      bundleId: 'bundleId',
      production: true,
    });

    await provider.sendMessage(
      {
        target: ['target'],
        title: 'title',
        content: 'content',
        payload: {
          data: 'data',
        },
        step: {
          digest: false,
          events: undefined,
          total_count: undefined,
        },
        subscriber: {},
      },
      {
        urlArgs: ['target'],
        _passthrough: {
          body: {
            topic: '_passthrough',
          },
        },
      }
    );

    expect(mockSend).toHaveBeenCalledWith(
      {
        encoding: 'utf8',
        payload: { data: 'data' },
        compiled: false,
        aps: {
          alert: {
            body: 'content',
            title: 'title',
          },
        },
        expiry: -1,
        priority: 10,
        topic: '_passthrough',
        'url-args': ['target'],
      },
      ['target']
    );
    expect(mockShutdown).toHaveBeenCalled();
  });

  test('should handle failed responses with reason', async () => {
    const mockSend = vi.fn(() => {
      return {
        failed: [
          {
            device: 'device123',
            response: {
              reason: 'BadDeviceToken',
            },
          },
        ],
        sent: [],
      };
    });
    const mockShutdown = vi.fn();

    vi.spyOn(apn as any, 'Provider').mockImplementation(() => {
      return {
        send: mockSend,
        shutdown: mockShutdown,
      };
    });

    const provider = new APNSPushProvider({
      key: 'key',
      keyId: 'keyId',
      teamId: 'teamId',
      bundleId: 'bundleId',
      production: true,
    });

    await expect(
      provider.sendMessage({
        target: ['device123'],
        title: 'title',
        content: 'content',
        payload: {},
        step: { digest: false, events: undefined, total_count: undefined },
        subscriber: {},
      })
    ).rejects.toThrow('device123 failed for reason: BadDeviceToken');
    expect(mockShutdown).toHaveBeenCalled();
  });

  test('should handle failed responses with error object', async () => {
    const mockSend = vi.fn(() => {
      return {
        failed: [
          {
            device: 'device123',
            error: new Error('Connection timeout'),
          },
        ],
        sent: [],
      };
    });
    const mockShutdown = vi.fn();

    vi.spyOn(apn as any, 'Provider').mockImplementation(() => {
      return {
        send: mockSend,
        shutdown: mockShutdown,
      };
    });

    const provider = new APNSPushProvider({
      key: 'key',
      keyId: 'keyId',
      teamId: 'teamId',
      bundleId: 'bundleId',
      production: true,
    });

    await expect(
      provider.sendMessage({
        target: ['device123'],
        title: 'title',
        content: 'content',
        payload: {},
        step: { digest: false, events: undefined, total_count: undefined },
        subscriber: {},
      })
    ).rejects.toThrow('device123 failed for reason: Connection timeout');
    expect(mockShutdown).toHaveBeenCalled();
  });

  test('should handle failed responses with no reason or error', async () => {
    const mockSend = vi.fn(() => {
      return {
        failed: [
          {
            device: 'device123',
          },
        ],
        sent: [],
      };
    });
    const mockShutdown = vi.fn();

    vi.spyOn(apn as any, 'Provider').mockImplementation(() => {
      return {
        send: mockSend,
        shutdown: mockShutdown,
      };
    });

    const provider = new APNSPushProvider({
      key: 'key',
      keyId: 'keyId',
      teamId: 'teamId',
      bundleId: 'bundleId',
      production: true,
    });

    await expect(
      provider.sendMessage({
        target: ['device123'],
        title: 'title',
        content: 'content',
        payload: {},
        step: { digest: false, events: undefined, total_count: undefined },
        subscriber: {},
      })
    ).rejects.toThrow('device123 failed for reason: Unknown error');
    expect(mockShutdown).toHaveBeenCalled();
  });

  test('should call shutdown even when send throws', async () => {
    const mockSend = vi.fn(() => {
      throw new Error('Network error');
    });
    const mockShutdown = vi.fn();

    vi.spyOn(apn as any, 'Provider').mockImplementation(() => {
      return {
        send: mockSend,
        shutdown: mockShutdown,
      };
    });

    const provider = new APNSPushProvider({
      key: 'key',
      keyId: 'keyId',
      teamId: 'teamId',
      bundleId: 'bundleId',
      production: true,
    });

    await expect(
      provider.sendMessage({
        target: ['device123'],
        title: 'title',
        content: 'content',
        payload: {},
        step: { digest: false, events: undefined, total_count: undefined },
        subscriber: {},
      })
    ).rejects.toThrow('Network error');
    expect(mockShutdown).toHaveBeenCalled();
  });

  describe('isTokenInvalid', () => {
    let provider: APNSPushProvider;

    beforeEach(() => {
      vi.spyOn(apn as any, 'Provider').mockImplementation(() => {
        return {
          send: vi.fn(),
          shutdown: vi.fn(),
        };
      });

      provider = new APNSPushProvider({
        key: 'key',
        keyId: 'keyId',
        teamId: 'teamId',
        bundleId: 'bundleId',
        production: true,
      });
    });

    test('should return true for BadDeviceToken', () => {
      expect(provider.isTokenInvalid('device123 failed for reason: BadDeviceToken')).toBe(true);
    });

    test('should return true for Unregistered', () => {
      expect(provider.isTokenInvalid('device123 failed for reason: Unregistered')).toBe(true);
    });

    test('should return true for DeviceTokenNotForTopic', () => {
      expect(provider.isTokenInvalid('device123 failed for reason: DeviceTokenNotForTopic')).toBe(true);
    });

    test('should return true for ExpiredToken', () => {
      expect(provider.isTokenInvalid('device123 failed for reason: ExpiredToken')).toBe(true);
    });

    test('should return false for other errors', () => {
      expect(provider.isTokenInvalid('device123 failed for reason: InternalServerError')).toBe(false);
    });

    test('should return false for undefined/null', () => {
      expect(provider.isTokenInvalid(undefined as any)).toBe(false);
      expect(provider.isTokenInvalid(null as any)).toBe(false);
    });
  });
});
