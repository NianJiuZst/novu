import { SendwithusEmailProvider } from './sendwithus.provider';
import { IEmailOptions } from '@novu/stateless';

const mockConfig = {
  apiKey: 'test-api-key',
  from: 'test@example.com',
  senderName: 'Test Sender',
};

const mockNovuMessage: IEmailOptions = {
  to: ['test@example.com'],
  subject: 'Test Subject',
  html: '<div>Test HTML Content</div>',
  text: 'Test Text Content',
  from: 'sender@example.com',
};

test('should trigger sendwithus correctly', async () => {
  const provider = new SendwithusEmailProvider(mockConfig);
  const payload = provider['createPayload'](mockNovuMessage);

  expect(payload).toEqual({
    template: 'novu_direct_send',
    recipient: {
      address: 'test@example.com',
      name: 'test@example.com',
    },
    sender: {
      address: 'sender@example.com',
      name: 'Test Sender',
    },
    template_data: {
      subject: 'Test Subject',
      html_content: '<div>Test HTML Content</div>',
      text_content: 'Test Text Content',
    },
  });
});

test('should handle CC and BCC correctly', async () => {
  const provider = new SendwithusEmailProvider(mockConfig);
  const messageWithCcBcc: IEmailOptions = {
    ...mockNovuMessage,
    cc: ['cc1@example.com', 'cc2@example.com'],
    bcc: ['bcc1@example.com'],
  };

  const payload = provider['createPayload'](messageWithCcBcc);

  expect(payload.cc).toEqual([
    { address: 'cc1@example.com' },
    { address: 'cc2@example.com' },
  ]);
  expect(payload.bcc).toEqual([{ address: 'bcc1@example.com' }]);
});

test('should handle reply-to correctly', async () => {
  const provider = new SendwithusEmailProvider(mockConfig);
  const messageWithReplyTo: IEmailOptions = {
    ...mockNovuMessage,
    replyTo: 'reply@example.com',
  };

  const payload = provider['createPayload'](messageWithReplyTo);

  expect(payload.sender.reply_to).toBe('reply@example.com');
});

test('should handle attachments correctly', async () => {
  const provider = new SendwithusEmailProvider(mockConfig);
  const messageWithAttachments: IEmailOptions = {
    ...mockNovuMessage,
    attachments: [
      {
        mime: 'text/plain',
        file: Buffer.from('test content'),
        name: 'test.txt',
      },
    ],
  };

  const payload = provider['createPayload'](messageWithAttachments);

  expect(payload.files).toEqual([
    {
      id: 'test.txt',
      data: Buffer.from('test content').toString('base64'),
    },
  ]);
});
