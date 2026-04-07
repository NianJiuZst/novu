import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['chat', '@chat-adapter/slack', '@chat-adapter/whatsapp', '@chat-adapter/github', '@resend/chat-sdk-adapter', '@chat-adapter/state-redis'],
  transpilePackages: ['@novu/react', '@novu/js'],
};

export default nextConfig;
