/**
 * Standalone script to send a test email via SMTP.
 *
 * Usage:
 *   pnpm send-email
 *   pnpm send-email -- --to someone@test.com --subject "Hello" --body "Custom body"
 *
 * Reads SMTP config from .env in the playground/nextjs directory.
 * Copy .env.example to .env and adjust values before running.
 *
 * Defaults work with a local Mailpit instance:
 *   docker run -d -p 1025:1025 -p 8025:8025 axllent/mailpit
 *   Then open http://localhost:8025 to inspect received mail.
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTransport } from 'nodemailer';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = resolve(__dirname, '../.env');

  try {
    const lines = readFileSync(envPath, 'utf8').split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed
        .slice(eq + 1)
        .trim()
        .replace(/^["']|["']$/g, '');
      if (!(key in process.env)) process.env[key] = val;
    }
  } catch {
    // .env is optional; env vars may already be set in the shell
  }
}

function getArg(flag) {
  const idx = process.argv.indexOf(flag);

  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

async function main() {
  loadEnv();

  const host = process.env.SMTP_HOST ?? 'localhost';
  const port = parseInt(process.env.SMTP_PORT ?? '1025', 10);
  const user = process.env.SMTP_USER ?? '';
  const pass = process.env.SMTP_PASS ?? '';
  const from = process.env.SMTP_FROM ?? 'test@localhost';
  const defaultTo = process.env.SMTP_TO ?? 'recipient@example.com';

  const to = getArg('--to') ?? defaultTo;
  const subject = getArg('--subject') ?? 'Test email from Novu playground';
  const body = getArg('--body') ?? 'This is a test email sent from the Novu Next.js playground SMTP script.';

  const transport = createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });

  console.log(`Sending email via ${host}:${port}`);
  console.log(`  From: ${from}`);
  console.log(`  To:   ${to}`);
  console.log(`  Subject: ${subject}`);

  const info = await transport.sendMail({
    from,
    to,
    subject,
    text: body,
    html: `<p>${body}</p>`,
  });

  console.log('\nEmail sent successfully');
  console.log(`  Message ID: ${info.messageId}`);
  console.log(`  Accepted:   ${info.accepted.join(', ')}`);

  if (info.rejected.length > 0) {
    console.warn(`  Rejected:   ${info.rejected.join(', ')}`);
  }

  transport.close();
}

main().catch((err) => {
  console.error('Failed to send email:', err.message);
  process.exit(1);
});
