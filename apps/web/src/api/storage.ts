import { api } from './api.client';

export function getSignedUrl({
  extension,
  operation,
  imagePath,
}: {
  extension: string;
  operation: 'read' | 'write';
  imagePath?: string;
}) {
  if (imagePath) {
    return api.get(`/v1/storage/signed-url?extension=${extension}&operation=${operation}&imagePath=${imagePath}`);
  }

  return api.get(`/v1/storage/signed-url?extension=${extension}&operation=${operation}&imagePath=""`);
}
