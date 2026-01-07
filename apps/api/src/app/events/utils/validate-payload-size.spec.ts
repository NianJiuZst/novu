import { PayloadTooLargeException } from '@nestjs/common';
import { FeatureFlagsService, SYSTEM_LIMITS } from '@novu/application-generic';
import { FeatureFlagsKeysEnum } from '@novu/shared';
import { expect } from 'chai';
import sinon from 'sinon';
import { validatePayloadSize } from './validate-payload-size';

describe('validatePayloadSize', () => {
  let featureFlagsService: sinon.SinonStubbedInstance<FeatureFlagsService>;
  const organizationId = 'org_123';

  beforeEach(() => {
    featureFlagsService = {
      getFlag: sinon.stub(),
    } as any;
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Valid payloads', () => {
    it('should not throw error for empty payload', async () => {
      featureFlagsService.getFlag.resolves(SYSTEM_LIMITS.TRIGGER_PAYLOAD_SIZE_BYTES);

      await validatePayloadSize(featureFlagsService as any, {}, organizationId);

      expect(featureFlagsService.getFlag.calledOnce).to.be.true;
    });

    it('should not throw error for small payload', async () => {
      featureFlagsService.getFlag.resolves(SYSTEM_LIMITS.TRIGGER_PAYLOAD_SIZE_BYTES);

      const payload = {
        name: 'John Doe',
        email: 'john@example.com',
        preferences: { notifications: true },
      };

      await validatePayloadSize(featureFlagsService as any, payload, organizationId);

      expect(featureFlagsService.getFlag.calledOnce).to.be.true;
    });

    it('should not throw error for payload at exact limit', async () => {
      const limit = 1024; // 1KB
      featureFlagsService.getFlag.resolves(limit);

      // Create payload that's exactly at the limit
      const charCount = Math.floor(limit / 2) - 10; // Account for JSON overhead
      const payload = { data: 'a'.repeat(charCount) };

      await validatePayloadSize(featureFlagsService as any, payload, organizationId);

      expect(featureFlagsService.getFlag.calledOnce).to.be.true;
    });
  });

  describe('Oversized payloads', () => {
    it('should throw error for payload exceeding default limit', async () => {
      featureFlagsService.getFlag.resolves(SYSTEM_LIMITS.TRIGGER_PAYLOAD_SIZE_BYTES);

      // Create a payload larger than 512KB
      const largeString = 'a'.repeat(600 * 1024); // 600KB
      const payload = { data: largeString };

      try {
        await validatePayloadSize(featureFlagsService as any, payload, organizationId);
        expect.fail('Should have thrown PayloadTooLargeException');
      } catch (error) {
        expect(error).to.be.instanceOf(PayloadTooLargeException);
        expect(error.message).to.include('Payload size');
        expect(error.message).to.include('exceeds maximum allowed size');
        expect(error.message).to.include('512KB');
      }
    });

    it('should throw error with correct size information', async () => {
      const limit = 1024; // 1KB
      featureFlagsService.getFlag.resolves(limit);

      const payload = { data: 'a'.repeat(2000) }; // Definitely over 1KB
      const expectedSize = Buffer.byteLength(JSON.stringify(payload));

      try {
        await validatePayloadSize(featureFlagsService as any, payload, organizationId);
        expect.fail('Should have thrown PayloadTooLargeException');
      } catch (error) {
        expect(error).to.be.instanceOf(PayloadTooLargeException);
        expect(error.message).to.include(`${expectedSize} bytes`);
        expect(error.message).to.include(`${limit} bytes`);
      }
    });
  });

  describe('Feature flag integration', () => {
    it('should use default limit when feature flag returns default value', async () => {
      featureFlagsService.getFlag.resolves(SYSTEM_LIMITS.TRIGGER_PAYLOAD_SIZE_BYTES);

      const payload = { test: 'data' };

      await validatePayloadSize(featureFlagsService as any, payload, organizationId);

      expect(
        featureFlagsService.getFlag.calledWith({
          key: FeatureFlagsKeysEnum.MAX_TRIGGER_PAYLOAD_SIZE_BYTES_NUMBER,
          defaultValue: SYSTEM_LIMITS.TRIGGER_PAYLOAD_SIZE_BYTES,
          organization: { _id: organizationId },
        })
      ).to.be.true;
    });

    it('should respect custom limit from feature flag', async () => {
      const customLimit = 1048576; // 1MB custom limit
      featureFlagsService.getFlag.resolves(customLimit);

      const largeString = 'a'.repeat(700 * 1024); // 700KB
      const payload = { data: largeString };

      // Should not throw with 1MB limit
      await validatePayloadSize(featureFlagsService as any, payload, organizationId);

      expect(featureFlagsService.getFlag.calledOnce).to.be.true;
    });

    it('should use organization-specific limit', async () => {
      const orgSpecificLimit = 2097152; // 2MB
      featureFlagsService.getFlag.resolves(orgSpecificLimit);

      const payload = { data: 'test' };

      await validatePayloadSize(featureFlagsService as any, payload, organizationId);

      expect(
        featureFlagsService.getFlag.calledWith(
          sinon.match({
            organization: { _id: organizationId },
          })
        )
      ).to.be.true;
    });
  });

  describe('Context information for bulk triggers', () => {
    it('should include event index and workflow name in error message', async () => {
      featureFlagsService.getFlag.resolves(1024); // 1KB

      const payload = { data: 'a'.repeat(2000) };
      const context = { index: 2, workflowName: 'welcome-email' };

      try {
        await validatePayloadSize(featureFlagsService as any, payload, organizationId, context);
        expect.fail('Should have thrown PayloadTooLargeException');
      } catch (error) {
        expect(error).to.be.instanceOf(PayloadTooLargeException);
        expect(error.message).to.include('Event at index 2');
        expect(error.message).to.include('workflow: "welcome-email"');
      }
    });

    it('should use generic error message without context', async () => {
      featureFlagsService.getFlag.resolves(1024); // 1KB

      const payload = { data: 'a'.repeat(2000) };

      try {
        await validatePayloadSize(featureFlagsService as any, payload, organizationId);
        expect.fail('Should have thrown PayloadTooLargeException');
      } catch (error) {
        expect(error).to.be.instanceOf(PayloadTooLargeException);
        expect(error.message).to.include('Payload size');
        expect(error.message).to.not.include('Event at index');
      }
    });

    it('should handle index 0 correctly', async () => {
      featureFlagsService.getFlag.resolves(1024); // 1KB

      const payload = { data: 'a'.repeat(2000) };
      const context = { index: 0, workflowName: 'first-workflow' };

      try {
        await validatePayloadSize(featureFlagsService as any, payload, organizationId, context);
        expect.fail('Should have thrown PayloadTooLargeException');
      } catch (error) {
        expect(error).to.be.instanceOf(PayloadTooLargeException);
        expect(error.message).to.include('Event at index 0');
        expect(error.message).to.include('workflow: "first-workflow"');
      }
    });
  });

  describe('Attachment handling', () => {
    it('should exclude attachments from size calculation', async () => {
      featureFlagsService.getFlag.resolves(SYSTEM_LIMITS.TRIGGER_PAYLOAD_SIZE_BYTES);

      // Large attachment (10MB base64)
      const largeAttachment = {
        name: 'large-file.pdf',
        file: 'a'.repeat(10 * 1024 * 1024), // 10MB
        mime: 'application/pdf',
      };

      const payload = {
        message: 'Hello World',
        attachments: [largeAttachment],
      };

      // Should not throw even though total payload is > 512KB
      await validatePayloadSize(featureFlagsService as any, payload, organizationId);

      expect(featureFlagsService.getFlag.calledOnce).to.be.true;
    });

    it('should validate payload size without attachments', async () => {
      const limit = 1024; // 1KB
      featureFlagsService.getFlag.resolves(limit);

      const payload = {
        data: 'a'.repeat(2000), // 2KB of data
        attachments: [{ name: 'file.pdf', file: 'small', mime: 'application/pdf' }],
      };

      try {
        await validatePayloadSize(featureFlagsService as any, payload, organizationId);
        expect.fail('Should have thrown PayloadTooLargeException');
      } catch (error) {
        expect(error).to.be.instanceOf(PayloadTooLargeException);
        expect(error.message).to.include('exceeds maximum allowed size');
        expect(error.message).to.include('Attachments are excluded from this limit');
      }
    });

    it('should allow large attachments with small payload', async () => {
      featureFlagsService.getFlag.resolves(SYSTEM_LIMITS.TRIGGER_PAYLOAD_SIZE_BYTES);

      const payload = {
        message: 'Short message',
        userId: '123',
        attachments: [
          {
            name: 'invoice.pdf',
            file: 'a'.repeat(20 * 1024 * 1024), // 20MB
            mime: 'application/pdf',
          },
          {
            name: 'receipt.pdf',
            file: 'b'.repeat(15 * 1024 * 1024), // 15MB
            mime: 'application/pdf',
          },
        ],
      };

      // Should not throw
      await validatePayloadSize(featureFlagsService as any, payload, organizationId);

      expect(featureFlagsService.getFlag.calledOnce).to.be.true;
    });

    it('should handle payload without attachments field', async () => {
      featureFlagsService.getFlag.resolves(SYSTEM_LIMITS.TRIGGER_PAYLOAD_SIZE_BYTES);

      const payload = {
        message: 'Hello World',
        userId: '123',
      };

      await validatePayloadSize(featureFlagsService as any, payload, organizationId);

      expect(featureFlagsService.getFlag.calledOnce).to.be.true;
    });
  });

  describe('Edge cases', () => {
    it('should handle payload with nested objects', async () => {
      featureFlagsService.getFlag.resolves(SYSTEM_LIMITS.TRIGGER_PAYLOAD_SIZE_BYTES);

      const payload = {
        user: {
          name: 'John',
          profile: {
            address: {
              street: '123 Main St',
              city: 'New York',
            },
          },
        },
        metadata: { tags: ['tag1', 'tag2'] },
      };

      await validatePayloadSize(featureFlagsService as any, payload, organizationId);

      expect(featureFlagsService.getFlag.calledOnce).to.be.true;
    });

    it('should handle payload with arrays', async () => {
      featureFlagsService.getFlag.resolves(SYSTEM_LIMITS.TRIGGER_PAYLOAD_SIZE_BYTES);

      const payload = {
        items: Array(100).fill({ id: 1, name: 'Item', price: 9.99 }),
      };

      await validatePayloadSize(featureFlagsService as any, payload, organizationId);

      expect(featureFlagsService.getFlag.calledOnce).to.be.true;
    });

    it('should handle payload with special characters', async () => {
      featureFlagsService.getFlag.resolves(SYSTEM_LIMITS.TRIGGER_PAYLOAD_SIZE_BYTES);

      const payload = {
        message: 'Hello 👋 World 🌍 with émojis and spëcial çharacters',
        unicode: '你好世界',
      };

      await validatePayloadSize(featureFlagsService as any, payload, organizationId);

      expect(featureFlagsService.getFlag.calledOnce).to.be.true;
    });

    it('should correctly calculate size for unicode characters', async () => {
      const limit = 100; // Small limit for testing
      featureFlagsService.getFlag.resolves(limit);

      // Unicode characters take more bytes than their string length
      const payload = { emoji: '🎉'.repeat(50) }; // Each emoji is 4 bytes

      try {
        await validatePayloadSize(featureFlagsService as any, payload, organizationId);
        expect.fail('Should have thrown PayloadTooLargeException');
      } catch (error) {
        expect(error).to.be.instanceOf(PayloadTooLargeException);
        expect(error.message).to.include('exceeds maximum allowed size');
      }
    });

    it('should handle payload with null and undefined values', async () => {
      featureFlagsService.getFlag.resolves(SYSTEM_LIMITS.TRIGGER_PAYLOAD_SIZE_BYTES);

      const payload = {
        name: 'John',
        age: null,
        email: undefined,
        active: true,
      };

      await validatePayloadSize(featureFlagsService as any, payload, organizationId);

      expect(featureFlagsService.getFlag.calledOnce).to.be.true;
    });
  });

  describe('Error message formatting', () => {
    it('should display size in KB correctly', async () => {
      const limit = 524288; // 512KB
      featureFlagsService.getFlag.resolves(limit);

      const payload = { data: 'a'.repeat(600 * 1024) }; // 600KB

      try {
        await validatePayloadSize(featureFlagsService as any, payload, organizationId);
        expect.fail('Should have thrown PayloadTooLargeException');
      } catch (error) {
        expect(error.message).to.include('512KB');
      }
    });

    it('should round KB value correctly', async () => {
      const limit = 500000; // ~488KB
      featureFlagsService.getFlag.resolves(limit);

      const payload = { data: 'a'.repeat(600 * 1024) };

      try {
        await validatePayloadSize(featureFlagsService as any, payload, organizationId);
        expect.fail('Should have thrown PayloadTooLargeException');
      } catch (error) {
        expect(error.message).to.include('488KB');
      }
    });
  });
});

