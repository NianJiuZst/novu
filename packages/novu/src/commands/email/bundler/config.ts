import type { BuildOptions } from 'esbuild';

interface BundlerConfigOptions {
  minify?: boolean;
}

export function getBundlerConfig(options: BundlerConfigOptions = {}): BuildOptions {
  const { minify = true } = options;

  return {
    bundle: true,
    platform: 'neutral',
    format: 'esm',
    target: 'es2022',
    minify,
    sourcemap: false,
    jsx: 'automatic',
    jsxImportSource: 'react',
    conditions: ['worker', 'browser'],
    mainFields: ['browser', 'module', 'main'],
    external: [],
    logLevel: 'warning',
    loader: {
      '.ts': 'tsx',
      '.js': 'jsx',
    },
    define: {
      'process.env.NODE_ENV': '"production"',
      'process.env': '{}',
      global: 'globalThis',
    },
    banner: {
      js: `
// Cloudflare Workers environment shims
globalThis.process = globalThis.process || { env: { NODE_ENV: 'production' } };
globalThis.global = globalThis.global || globalThis;

// MessageChannel polyfill for React
globalThis.MessageChannel = globalThis.MessageChannel || class MessageChannel {
  constructor() {
    this.port1 = { postMessage: () => {}, onmessage: null };
    this.port2 = { postMessage: () => {}, onmessage: null };
  }
};
      `.trim(),
    },
  };
}
