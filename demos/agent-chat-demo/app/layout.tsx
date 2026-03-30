import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Wine Bot — Novu Agent Demo',
  description: 'AI sommelier powered by Chat SDK + Novu',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', background: '#0a0a0a', color: '#fafafa' }}>
        {children}
      </body>
    </html>
  );
}
