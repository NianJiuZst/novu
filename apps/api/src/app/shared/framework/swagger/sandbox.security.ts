import { applyDecorators, SetMetadata } from '@nestjs/common';

export const SANDBOX_ACCESSIBLE = 'sandbox_accessible';

export function SandboxAccessible() {
  return applyDecorators(SetMetadata(SANDBOX_ACCESSIBLE, true));
}
