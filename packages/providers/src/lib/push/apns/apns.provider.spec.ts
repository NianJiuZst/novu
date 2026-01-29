import apn from '@parse/node-apn';
import { expect, test, vi } from 'vitest';
import { APNSPushProvider } from './apns.provider';

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

  vi.spyOn(apn as any, 'Provider').mockImplementation(() => {
    return {
      send: mockSend,
      shutdown: () => {},
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

  vi.spyOn(apn as any, 'Provider').mockImplementation(() => {
    return {
      send: mockSend,
      shutdown: () => {},
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
});

test('should handle sound property as string', async () => {
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

  vi.spyOn(apn as any, 'Provider').mockImplementation(() => {
    return {
      send: mockSend,
      shutdown: () => {},
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
    overrides: {
      sound: 'default',
      badge: 5,
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
        badge: 5,
        sound: 'default',
      },
      expiry: -1,
      priority: 10,
      topic: 'bundleId',
    },
    ['target']
  );
});

test('should handle sound property as ApsSound object', async () => {
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

  vi.spyOn(apn as any, 'Provider').mockImplementation(() => {
    return {
      send: mockSend,
      shutdown: () => {},
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
    overrides: {
      sound: {
        critical: 1,
        name: 'alert.caf',
        volume: 0.8,
      },
      badge: 3,
      mutableContent: true,
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
        badge: 3,
        sound: {
          critical: 1,
          name: 'alert.caf',
          volume: 0.8,
        },
        'mutable-content': 1,
      },
      expiry: -1,
      priority: 10,
      topic: 'bundleId',
    },
    ['target']
  );
});
