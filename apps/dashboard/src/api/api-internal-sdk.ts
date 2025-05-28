import { SDKOptions } from '@novu/api/lib/config';
import * as NovuAPI from '@novu/api';
import { IEnvironment } from '@novu/shared';
import { getToken } from '@/utils/auth.ts';
import { API_HOSTNAME } from '@/config';
import { HTTPClient } from '@novu/api/lib/http';

const { Novu } = NovuAPI;

export async function initNovuSdk(env: IEnvironment) {
  const options: SDKOptions = {
    security: { bearerAuth: await getToken() },
    serverURL: API_HOSTNAME ?? 'https://api.novu.co',
    httpClient: new CustomHeaderHTTPClient({
      ['Novu-Environment-Id']: env._id,
    }),
  };

  return new Novu(options);
}

export class CustomHeaderHTTPClient extends HTTPClient {
  private defaultHeaders: HeadersInit;

  constructor(defaultHeaders: HeadersInit = {}) {
    super({});
    this.defaultHeaders = defaultHeaders;
  }

  async request(request: Request): Promise<Response> {
    // Create a new request with merged headers
    const mergedHeaders = new Headers(this.defaultHeaders);

    /*
     * Merge existing request headers with default headers
     * Existing request headers take precedence
     */
    request.headers.forEach((value, key) => {
      mergedHeaders.set(key, value);
    });

    // Create a new request with merged headers
    const modifiedRequest = new Request(request, {
      headers: mergedHeaders,
    });

    // Call the parent class's request method with the modified request
    return super.request(modifiedRequest);
  }
}
