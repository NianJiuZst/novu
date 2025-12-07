import { RedirectTargetEnum } from '@novu/shared';

export const urlTargetTypes = [
  RedirectTargetEnum.SELF,
  RedirectTargetEnum.BLANK,
  RedirectTargetEnum.PARENT,
  RedirectTargetEnum.TOP,
  RedirectTargetEnum.UNFENCED_TOP,
];

export function openInNewTab(url: string) {
  return window.open(url, '_blank', 'noreferrer noopener');
}

const ALLOWED_PROTOCOLS = ['http:', 'https:'];

export function assertProtocol(url: URL | string | null) {
  if (!url) {
    return;
  }

  if (typeof url === 'string') {
    url = new URL(url);
  }

  if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
    throw new Error(`Novu: "${url.protocol}" protocol from "${url}" is not allowed.`);
  }
}
