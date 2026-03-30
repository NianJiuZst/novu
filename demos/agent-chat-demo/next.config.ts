import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['chat', '@chat-adapter/slack', '@chat-adapter/state-redis'],
  transpilePackages: ['@novu/react', '@novu/js'],
};

export default nextConfig;
