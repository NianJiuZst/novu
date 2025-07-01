import { DyspatchEmailProvider } from './dyspatch.provider';

const mockConfig = {
  apiKey: 'test-api-key',
  from: 'test@example.com',
  senderName: 'Test Sender',
};

const mockNovuMessage = {
  from: 'test@example.com',
  to: ['recipient@example.com'],
  html: '<div>Test content</div>',
  subject: 'Test subject',
};

test('should trigger dyspatch correctly', async () => {
  const provider = new DyspatchEmailProvider(mockConfig);
  const spy = jest.spyOn(provider['axiosInstance'], 'post').mockImplementation(async () => {
    return {
      data: {
        success: true,
        status: 'OK',
        receipt_id: 'log_test123',
        email: {
          name: 'Test Template',
          version_name: 'Original',
        },
      },
    } as any;
  });

  await provider.sendMessage(mockNovuMessage);
  expect(spy).toHaveBeenCalled();
  expect(spy).toHaveBeenCalledWith('/send', expect.objectContaining({
    template: 'tem_default',
    recipient: {
      address: 'recipient@example.com',
      name: undefined,
    },
    sender: {
      address: 'test@example.com',
      name: 'Test Sender',
      reply_to: undefined,
    },
    template_data: expect.objectContaining({
      subject: 'Test subject',
      html: '<div>Test content</div>',
    }),
  }));
});

test('should check provider integration correctly', async () => {
  const provider = new DyspatchEmailProvider(mockConfig);
  const spy = jest.spyOn(provider['axiosInstance'], 'get').mockImplementation(async () => {
    return { data: [] } as any;
  });

  const response = await provider.checkIntegration(mockNovuMessage);
  expect(spy).toHaveBeenCalled();
  expect(response.success).toBe(true);
  expect(response.message).toBe('Integration successful');
});

test('should handle integration check error correctly', async () => {
  const provider = new DyspatchEmailProvider(mockConfig);
  const spy = jest.spyOn(provider['axiosInstance'], 'get').mockImplementation(async () => {
    throw {
      response: {
        status: 401,
        data: { message: 'Unauthorized' },
      },
    };
  });

  const response = await provider.checkIntegration(mockNovuMessage);
  expect(spy).toHaveBeenCalled();
  expect(response.success).toBe(false);
  expect(response.message).toBe('Unauthorized');
});
