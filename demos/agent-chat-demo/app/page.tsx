'use client';

import { useState } from 'react';
import { Inbox } from '@novu/react';

const NOVU_APP_ID = process.env.NEXT_PUBLIC_NOVU_APP_ID ?? '';
const NOVU_BACKEND_URL = process.env.NEXT_PUBLIC_NOVU_BACKEND_URL;
const NOVU_SOCKET_URL = process.env.NEXT_PUBLIC_NOVU_SOCKET_URL;

export default function Home() {
  const [subscriberId, setSubscriberId] = useState('');
  const [activeId, setActiveId] = useState('');

  function handleConnect() {
    setActiveId(subscriberId.trim());
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
          Wine Bot — Novu Agent Demo
        </h1>
        <p style={{ color: '#888', fontSize: 15, lineHeight: 1.5 }}>
          Mention <strong>@wine-bot</strong> in Slack to start a conversation.
          Notifications from the agent appear below in the Novu Inbox.
        </p>
      </div>

      {!activeId ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="Enter your Slack User ID (e.g. U07XXXXXX)"
            value={subscriberId}
            onChange={(e) => setSubscriberId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid #333',
              background: '#141414',
              color: '#fafafa',
              fontSize: 14,
              outline: 'none',
            }}
          />
          <button
            onClick={handleConnect}
            disabled={!subscriberId.trim()}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              background: subscriberId.trim() ? '#7c3aed' : '#333',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: subscriberId.trim() ? 'pointer' : 'default',
            }}
          >
            Connect Inbox
          </button>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#888' }}>
              Connected as <strong style={{ color: '#a78bfa' }}>{activeId}</strong>
            </span>
            <button
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
              Disconnect
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
          <li><strong>Chat SDK</strong> receives your Slack message via webhook</li>
          <li>The <code style={{ color: '#a78bfa' }}>agent()</code> handler runs your custom AI code (OpenAI sommelier)</li>
          <li>The <code style={{ color: '#a78bfa' }}>novu</code> context collects signals — state updates, workflow triggers</li>
          <li>Response goes back to Slack via Chat SDK</li>
          <li>Signals execute: <code style={{ color: '#a78bfa' }}>novu.trigger()</code> fires Novu workflows</li>
          <li>In-app notifications appear here in the Inbox in real time</li>
        </ol>
      </div>
    </div>
  );
}
