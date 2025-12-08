import { StepTypeEnum } from '@novu/shared';

export function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return current;
}

export function parseVariablesForPreview(
  text: string,
  previewPayload?: Record<string, unknown>,
  suggestedPayload?: Record<string, string>
): string {
  if (!text) return text;

  return text.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
    const trimmedVar = variable.trim();

    if (previewPayload) {
      const value = getNestedValue(previewPayload, trimmedVar);
      if (value !== undefined && value !== null && value !== '') {
        return String(value);
      }
    }

    if (suggestedPayload && trimmedVar.startsWith('payload.')) {
      const payloadKey = trimmedVar.replace('payload.', '');
      if (suggestedPayload[payloadKey]) {
        return suggestedPayload[payloadKey];
      }
    }

    return '';
  });
}

export function safeParseJson(json: string): Record<string, unknown> | undefined {
  try {
    return JSON.parse(json);
  } catch {
    return undefined;
  }
}

export function getPlaceholderText(stepType: StepTypeEnum): string {
  const placeholders: Record<string, string> = {
    [StepTypeEnum.EMAIL]: 'Describe the email you want to generate...',
    [StepTypeEnum.SMS]: 'Describe the SMS message you want to generate...',
    [StepTypeEnum.PUSH]: 'Describe the push notification you want to generate...',
    [StepTypeEnum.IN_APP]: 'Describe the in-app notification you want to generate...',
    [StepTypeEnum.CHAT]: 'Describe the chat message you want to generate...',
  };

  return placeholders[stepType] || 'Describe what you want to generate...';
}

export function getChannelLabel(stepType: StepTypeEnum): string {
  const labels: Record<string, string> = {
    [StepTypeEnum.EMAIL]: 'email',
    [StepTypeEnum.SMS]: 'SMS',
    [StepTypeEnum.PUSH]: 'push notification',
    [StepTypeEnum.IN_APP]: 'in-app notification',
    [StepTypeEnum.CHAT]: 'chat message',
  };

  return labels[stepType] || 'content';
}
