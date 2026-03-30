import type { Request, Response } from 'express';

type RequestWithRawBody = Request & { rawBody?: Buffer };

function buildRequestBody(req: RequestWithRawBody): BodyInit | undefined {
  if (req.method === 'GET' || req.method === 'HEAD') {
    return undefined;
  }

  if (req.rawBody?.length) {
    return new Uint8Array(req.rawBody);
  }

  if (typeof req.body === 'string') {
    return req.body;
  }

  if (req.body !== undefined && req.body !== null) {
    return JSON.stringify(req.body);
  }

  return undefined;
}

export function expressToFetchRequest(req: Request): globalThis.Request {
  const protocol = req.protocol;
  const host = req.get('host') ?? 'localhost';
  const url = `${protocol}://${host}${req.originalUrl}`;
  const headers = new Headers();

  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const v of value) {
        headers.append(key, v);
      }
    } else {
      headers.set(key, value);
    }
  }

  const body = buildRequestBody(req as RequestWithRawBody);
  const init: RequestInit = {
    method: req.method,
    headers,
  };

  if (body !== undefined) {
    init.body = body;
  }

  return new globalThis.Request(url, init);
}

export async function sendFetchResponse(fetchRes: globalThis.Response, expressRes: Response): Promise<void> {
  expressRes.status(fetchRes.status);

  fetchRes.headers.forEach((value, key) => {
    expressRes.setHeader(key, value);
  });

  const buffer = Buffer.from(await fetchRes.arrayBuffer());

  expressRes.send(buffer);
}
