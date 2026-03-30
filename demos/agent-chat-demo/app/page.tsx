'use client';

import { useState } from 'react';
import { Inbox } from '@novu/react';

const NOVU_APP_ID = process.env.NEXT_PUBLIC_NOVU_APP_ID ?? '';
const NOVU_BACKEND_URL = process.env.NEXT_PUBLIC_NOVU_BACKEND_URL;
const NOVU_SOCKET_URL = process.env.NEXT_PUBLIC_NOVU_SOCKET_URL;

export default function Home() {
  const [appUserId, setAppUserId] = useState('');
  const [subscriberEmail, setSubscriberEmail] = useState('');
  const [activeId, setActiveId] = useState('');
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connectLoading, setConnectLoading] = useState(false);
  const [dmEndpointError, setDmEndpointError] = useState<string | null>(null);
  const [dmEndpointOk, setDmEndpointOk] = useState<string | null>(null);
  const [dmEndpointLoading, setDmEndpointLoading] = useState(false);

  function handleOpenInbox() {
    setActiveId(appUserId.trim());
  }

  async function handleConnectSlack() {
    const subscriberId = appUserId.trim();

    if (!subscriberId) {
      return;
    }

    setConnectError(null);
    setConnectLoading(true);

    try {
      const res = await fetch('/api/slack-connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriberId,
          ...(subscriberEmail.trim() ? { email: subscriberEmail.trim() } : {}),
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };

      if (!res.ok || !data.url) {
        setConnectError(data.error ?? 'Failed to start Slack OAuth');

        return;
      }

      window.location.assign(data.url);
    } catch {
      setConnectError('Network error starting Slack OAuth');
    } finally {
      setConnectLoading(false);
    }
  }

  async function handleRegisterSlackDmEndpoint() {
    const subscriberId = appUserId.trim();

    if (!subscriberId) {
      return;
    }

    setDmEndpointError(null);
    setDmEndpointOk(null);
    setDmEndpointLoading(true);

    try {
      const res = await fetch('/api/slack-dm-endpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriberId,
          ...(subscriberEmail.trim() ? { emailOverride: subscriberEmail.trim() } : {}),
        }),
      });
      const data = (await res.json()) as { slackUserId?: string; error?: string };

      if (!res.ok) {
        setDmEndpointError(data.error ?? 'Failed to register Slack DM endpoint');

        return;
      }

      setDmEndpointOk(
        data.slackUserId
          ? `Registered slack_user endpoint (Slack user ${data.slackUserId}).`
          : 'Registered slack_user endpoint.'
      );
    } catch {
      setDmEndpointError('Network error');
    } finally {
      setDmEndpointLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
          Wine Bot — Novu Agent Demo
        </h1>
        <p style={{ color: '#888', fontSize: 15, lineHeight: 1.5 }}>
          Use your <strong>app user id</strong> (simulating a logged-in account). Connect Slack once with OAuth so
          Novu links that id to your workspace. Mention <strong>@wine-bot</strong> in Slack — agent notifications use
          the same subscriber id and show up below.
        </p>
      </div>

      {!activeId ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="text"
            placeholder="App user id (e.g. user_123)"
            value={appUserId}
            onChange={(e) => setAppUserId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && appUserId.trim() && handleOpenInbox()}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid #333',
              background: '#141414',
              color: '#fafafa',
              fontSize: 14,
              outline: 'none',
            }}
          />
          <input
            type="email"
            placeholder="Email (same as Slack — used for users.lookupByEmail after connect)"
            value={subscriberEmail}
            onChange={(e) => setSubscriberEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid #333',
              background: '#141414',
              color: '#fafafa',
              fontSize: 14,
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button
              type="button"
              onClick={handleConnectSlack}
              disabled={!appUserId.trim() || connectLoading}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: 'none',
                background: appUserId.trim() && !connectLoading ? '#0ea5e9' : '#333',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: appUserId.trim() && !connectLoading ? 'pointer' : 'default',
              }}
            >
              {connectLoading ? 'Starting OAuth…' : 'Connect Slack'}
            </button>
            <button
              type="button"
              onClick={handleRegisterSlackDmEndpoint}
              disabled={!appUserId.trim() || dmEndpointLoading}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: 'none',
                background: appUserId.trim() && !dmEndpointLoading ? '#059669' : '#333',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: appUserId.trim() && !dmEndpointLoading ? 'pointer' : 'default',
              }}
            >
              {dmEndpointLoading ? 'Registering…' : 'Register Slack DM endpoint'}
            </button>
            <button
              type="button"
              onClick={handleOpenInbox}
              disabled={!appUserId.trim()}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: 'none',
                background: appUserId.trim() ? '#7c3aed' : '#333',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: appUserId.trim() ? 'pointer' : 'default',
              }}
            >
              Open Inbox
            </button>
          </div>
          {connectError ? (
            <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>{connectError}</p>
          ) : null}
          {dmEndpointError ? (
            <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>{dmEndpointError}</p>
          ) : null}
          {dmEndpointOk ? (
            <p style={{ color: '#4ade80', fontSize: 13, margin: 0 }}>{dmEndpointOk}</p>
          ) : null}
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: '#888' }}>
              Inbox subscriber <strong style={{ color: '#a78bfa' }}>{activeId}</strong>
            </span>
            <button
              type="button"
              onClick={() => setActiveId('')}
              style={{
                padding: '4px 12px',
                borderRadius: 6,
                border: '1px solid #333',
                background: 'transparent',
                color: '#888',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Back
            </button>
          </div>

          <div style={{ border: '1px solid #222', borderRadius: 12, overflow: 'hidden', minHeight: 400 }}>
            <Inbox
              applicationIdentifier={NOVU_APP_ID}
              subscriberId={activeId}
              backendUrl={NOVU_BACKEND_URL}
              socketUrl={NOVU_SOCKET_URL}
            />
          </div>
        </div>
      )}

      <div style={{ marginTop: 48, padding: 24, background: '#141414', borderRadius: 12, border: '1px solid #222' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>How it works</h2>
        <ol style={{ fontSize: 14, color: '#aaa', lineHeight: 1.8, paddingLeft: 20 }}>
          <li>
            <strong>Connect Slack</strong> uses your app user id as Novu <code style={{ color: '#a78bfa' }}>subscriberId</code> in
            OAuth state — same id powers the Inbox. Optionally set email (must match your Slack account).
          </li>
          <li>
            After OAuth finishes, click <strong>Register Slack DM endpoint</strong> (needs{' '}
            <code style={{ color: '#a78bfa' }}>SLACK_BOT_USER_OAUTH_TOKEN</code> in <code style={{ color: '#a78bfa' }}>.env.local</code>
            — the workspace <code style={{ color: '#a78bfa' }}>xoxb-</code> token from the same Slack app) so Novu gets a{' '}
            <code style={{ color: '#a78bfa' }}>slack_user</code> endpoint per{' '}
            <a
              href="https://docs.novu.co/platform/integrations/chat/slack#send-to-a-slack-user-direct-messages"
              style={{ color: '#38bdf8' }}
              target="_blank"
              rel="noreferrer"
            >
              Novu docs
            </a>
            .
          </li>
          <li>
            The webhook resolves Slack <code style={{ color: '#a78bfa' }}>U…</code> users to that subscriber (via{' '}
            <code style={{ color: '#a78bfa' }}>slack_user</code> endpoints and a single-connection demo fallback).
          </li>
          <li>
            The <code style={{ color: '#a78bfa' }}>agent()</code> handler runs your AI code;{' '}
            <code style={{ color: '#a78bfa' }}>novu.trigger()</code> targets the resolved subscriber.
          </li>
          <li>In-app notifications appear here in real time.</li>
        </ol>
      </div>
    </div>
  );
}
