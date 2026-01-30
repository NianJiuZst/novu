# Proxying Novu API Through a Custom Domain

This guide explains how to configure Novu SDKs to use a custom domain or proxy server when the default Novu API domains (`api.novu.co` or `eu.api.novu.co`) are blocked by corporate firewalls.

## Overview

Novu's client SDKs connect to two types of services:
1. **REST API** - For fetching notifications, preferences, and other data
2. **WebSocket** - For real-time notification updates

Default endpoints:
| Region | REST API | WebSocket |
|--------|----------|-----------|
| US | `https://api.novu.co` | `wss://ws.novu.co` |
| EU | `https://eu.api.novu.co` | `wss://eu.ws.novu.co` |

If these domains are blocked by your corporate firewall, you can set up a reverse proxy on your own domain and configure the Novu SDKs to use your custom endpoints.

## Solution Architecture

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  Your App   │ ──────► │  Your Proxy      │ ──────► │  Novu API       │
│  (Browser)  │         │  (your-domain)   │         │  (eu.api.novu.co)│
└─────────────┘         └──────────────────┘         └─────────────────┘
```

## SDK Configuration

All Novu client SDKs support custom API and WebSocket URLs.

### JavaScript SDK (`@novu/js`)

```typescript
import { Novu } from '@novu/js';

const novu = new Novu({
  applicationIdentifier: 'YOUR_APP_IDENTIFIER',
  subscriber: 'SUBSCRIBER_ID',
  // Point to your proxy server instead of Novu's API
  apiUrl: 'https://novu-proxy.your-company.com',
  socketUrl: 'wss://novu-ws-proxy.your-company.com',
});
```

### React SDK (`@novu/react`)

```tsx
import { Inbox } from '@novu/react';

function NotificationInbox() {
  return (
    <Inbox
      applicationIdentifier="YOUR_APP_IDENTIFIER"
      subscriberId="SUBSCRIBER_ID"
      // Point to your proxy server
      backendUrl="https://novu-proxy.your-company.com"
      socketUrl="wss://novu-ws-proxy.your-company.com"
    />
  );
}
```

Or with `NovuProvider`:

```tsx
import { NovuProvider, useNotifications } from '@novu/react';

function App() {
  return (
    <NovuProvider
      applicationIdentifier="YOUR_APP_IDENTIFIER"
      subscriberId="SUBSCRIBER_ID"
      backendUrl="https://novu-proxy.your-company.com"
      socketUrl="wss://novu-ws-proxy.your-company.com"
    >
      <YourComponent />
    </NovuProvider>
  );
}
```

### Next.js SDK (`@novu/nextjs`)

```tsx
import { Inbox } from '@novu/nextjs';

function NotificationInbox() {
  return (
    <Inbox
      options={{
        applicationIdentifier: 'YOUR_APP_IDENTIFIER',
        subscriberId: 'SUBSCRIBER_ID',
        backendUrl: 'https://novu-proxy.your-company.com',
        socketUrl: 'wss://novu-ws-proxy.your-company.com',
      }}
    />
  );
}
```

### Framework SDK (`@novu/framework`) - Server-side

For server-side workflow definitions:

```typescript
import { Client } from '@novu/framework';

const client = new Client({
  apiUrl: 'https://novu-proxy.your-company.com',
  secretKey: process.env.NOVU_SECRET_KEY,
});
```

Or via environment variable:

```bash
NOVU_API_URL=https://novu-proxy.your-company.com
NOVU_SECRET_KEY=your_secret_key
```

### Backend API SDK (`@novu/api`)

```typescript
import { Novu } from '@novu/api';

const novu = new Novu({
  secretKey: 'YOUR_SECRET_KEY',
  serverURL: 'https://novu-proxy.your-company.com',
});
```

## Reverse Proxy Configuration Examples

### Nginx

Create a reverse proxy that forwards requests to Novu's EU API:

```nginx
# /etc/nginx/sites-available/novu-proxy

# REST API Proxy
server {
    listen 443 ssl;
    server_name novu-proxy.your-company.com;

    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;

    location / {
        proxy_pass https://eu.api.novu.co;
        proxy_set_header Host eu.api.novu.co;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Required for proper SSL passthrough
        proxy_ssl_server_name on;
        proxy_ssl_name eu.api.novu.co;
        
        # CORS headers (if needed)
        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
        add_header Access-Control-Allow-Headers 'Authorization, Content-Type, Novu-API-Version, Novu-Client-Version' always;
        
        if ($request_method = OPTIONS) {
            return 204;
        }
    }
}

# WebSocket Proxy
server {
    listen 443 ssl;
    server_name novu-ws-proxy.your-company.com;

    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;

    location / {
        proxy_pass https://eu.ws.novu.co;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host eu.ws.novu.co;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # WebSocket timeout settings
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
        
        # Required for proper SSL passthrough
        proxy_ssl_server_name on;
        proxy_ssl_name eu.ws.novu.co;
    }
}
```

### Cloudflare Workers

```javascript
// Cloudflare Worker for proxying Novu API

const NOVU_API_HOST = 'eu.api.novu.co';

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type, Novu-API-Version, Novu-Client-Version',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Forward the request to Novu API
  const novuUrl = `https://${NOVU_API_HOST}${url.pathname}${url.search}`;
  
  const modifiedRequest = new Request(novuUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });

  const response = await fetch(modifiedRequest);
  
  // Add CORS headers to response
  const modifiedResponse = new Response(response.body, response);
  modifiedResponse.headers.set('Access-Control-Allow-Origin', '*');
  
  return modifiedResponse;
}
```

### AWS Application Load Balancer + Lambda

For AWS infrastructure, you can use an ALB with a Lambda function:

```typescript
// Lambda function for proxying Novu API
import { APIGatewayProxyHandler } from 'aws-lambda';
import fetch from 'node-fetch';

const NOVU_API_HOST = 'eu.api.novu.co';

export const handler: APIGatewayProxyHandler = async (event) => {
  const { httpMethod, path, queryStringParameters, headers, body } = event;
  
  // Handle CORS preflight
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type, Novu-API-Version, Novu-Client-Version',
      },
      body: '',
    };
  }

  const queryString = queryStringParameters 
    ? '?' + new URLSearchParams(queryStringParameters as Record<string, string>).toString()
    : '';
  
  const novuUrl = `https://${NOVU_API_HOST}${path}${queryString}`;
  
  const response = await fetch(novuUrl, {
    method: httpMethod,
    headers: {
      'Authorization': headers['Authorization'] || headers['authorization'] || '',
      'Content-Type': 'application/json',
      'Novu-API-Version': headers['Novu-API-Version'] || headers['novu-api-version'] || '',
      'Novu-Client-Version': headers['Novu-Client-Version'] || headers['novu-client-version'] || '',
    },
    body: body || undefined,
  });

  const responseBody = await response.text();

  return {
    statusCode: response.status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
    body: responseBody,
  };
};
```

### Docker Compose with Nginx

If you're using Docker, here's a complete setup:

```yaml
# docker-compose.proxy.yml
version: '3.8'

services:
  novu-proxy:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    restart: unless-stopped
```

## Environment Variables

You can use environment variables to configure the proxy URLs:

### Client-side (React/Next.js)

```bash
# .env.local
NEXT_PUBLIC_NOVU_BACKEND_URL=https://novu-proxy.your-company.com
NEXT_PUBLIC_NOVU_SOCKET_URL=wss://novu-ws-proxy.your-company.com
```

```tsx
// Usage in your app
<Inbox
  applicationIdentifier={process.env.NEXT_PUBLIC_NOVU_APP_ID}
  subscriberId={subscriberId}
  backendUrl={process.env.NEXT_PUBLIC_NOVU_BACKEND_URL}
  socketUrl={process.env.NEXT_PUBLIC_NOVU_SOCKET_URL}
/>
```

### Server-side (Node.js)

```bash
# .env
NOVU_API_URL=https://novu-proxy.your-company.com
NOVU_SECRET_KEY=your_secret_key
```

## Security Considerations

1. **SSL/TLS**: Always use HTTPS/WSS for your proxy to ensure data is encrypted in transit.

2. **Authentication**: The Novu SDKs handle authentication via tokens. Your proxy should pass through all headers unchanged.

3. **Rate Limiting**: Consider implementing rate limiting on your proxy to prevent abuse.

4. **IP Whitelisting**: If possible, whitelist only the IP ranges that need access to your proxy.

5. **Logging**: Enable access logging on your proxy for debugging and monitoring purposes.

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure your proxy adds the proper CORS headers for browser requests.

2. **WebSocket Connection Failures**: Make sure your proxy supports WebSocket upgrade headers and has appropriate timeout settings.

3. **SSL Certificate Issues**: Verify that your proxy's SSL certificate is valid and trusted by clients.

4. **502 Bad Gateway**: Check that your proxy can reach Novu's servers. You may need to whitelist Novu's IP addresses in your egress firewall.

### Testing Your Proxy

Test your REST API proxy:
```bash
curl -X GET https://novu-proxy.your-company.com/v1/health \
  -H "Content-Type: application/json"
```

Test with authentication:
```bash
curl -X POST https://novu-proxy.your-company.com/v1/inbox/session \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"applicationIdentifier": "YOUR_APP_ID", "subscriber": {"subscriberId": "test"}}'
```

## Support

If you encounter issues with this setup:
1. Verify your proxy configuration is correctly forwarding all headers
2. Check proxy logs for error messages
3. Ensure Novu's backend services are reachable from your proxy server
4. Contact Novu support with your proxy configuration details
