import { PayloadTooLargeException } from '@nestjs/common';
import { FeatureFlagsService, SYSTEM_LIMITS } from '@novu/application-generic';
import { FeatureFlagsKeysEnum } from '@novu/shared';

export async function validatePayloadSize(
  featureFlagsService: FeatureFlagsService,
  payload: Record<string, unknown>,
  organizationId: string,
  context?: { index?: number; workflowName?: string }
): Promise<void> {
  const maxPayloadSize = await featureFlagsService.getFlag({
    key: FeatureFlagsKeysEnum.MAX_TRIGGER_PAYLOAD_SIZE_BYTES_NUMBER,
    defaultValue: SYSTEM_LIMITS.TRIGGER_PAYLOAD_SIZE_BYTES,
    organization: { _id: organizationId },
  });

  // Exclude attachments from size calculation as they are uploaded to storage separately
  const { attachments, ...payloadWithoutAttachments } = payload;

  const payloadSize = Buffer.byteLength(JSON.stringify(payloadWithoutAttachments));

  if (payloadSize > maxPayloadSize) {
    const contextInfo =
      context?.index !== undefined
        ? `Event at index ${context.index} (workflow: "${context.workflowName}") has payload size`
        : 'Payload size';

    throw new PayloadTooLargeException(
      `${contextInfo} (${payloadSize} bytes) exceeds maximum allowed size of ${maxPayloadSize} bytes (${Math.round(maxPayloadSize / 1024)}KB). Note: Attachments are excluded from this limit.`
    );
  }
}

