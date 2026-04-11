/**
 * Node 22+ may run .ts through native type-stripping before ts-node, which breaks decorators.
 * Disable stripping only when supported (Node 22+). Node 20 has no such flag.
 */
const { spawnSync } = require('node:child_process');
const { join } = require('node:path');

const major = Number.parseInt(process.versions.node.split('.')[0], 10);
const mochaBin = join(__dirname, '..', 'node_modules', 'mocha', 'bin', '_mocha');
const nodeArgs = major >= 22 ? ['--no-experimental-strip-types'] : [];
const args = [...nodeArgs, mochaBin, ...process.argv.slice(2)];

const result = spawnSync(process.execPath, args, { stdio: 'inherit', shell: false });

process.exit(result.status === null ? 1 : result.status);
