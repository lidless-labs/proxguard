/**
 * Test runner: compile TypeScript (no new deps) then run node:test against .test-dist.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(root);
const outDir = join(repoRoot, '.test-dist');

execFileSync('npx', ['tsc', '-p', join(repoRoot, 'tsconfig.test.json')], {
  cwd: repoRoot,
  stdio: 'inherit',
});

writeFileSync(join(outDir, 'package.json'), JSON.stringify({ type: 'commonjs' }));

const testFiles = [
  join(outDir, 'tests/issue10-permit-root-login.test.js'),
  join(outDir, 'tests/issue11-missing-config.test.js'),
  join(outDir, 'tests/issue13-iptables-accept-input.test.js'),
];

for (const file of testFiles) {
  if (!existsSync(file)) {
    throw new Error(`compiled test missing: ${file}`);
  }
}

execFileSync('node', ['--test', ...testFiles], {
  cwd: repoRoot,
  stdio: 'inherit',
});
