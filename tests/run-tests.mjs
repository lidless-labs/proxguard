/**
 * Test runner: compile TypeScript (no new deps) then run node:test against .test-dist.
 * Every tests/*.test.ts file is discovered automatically after compilation.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(root);
const outDir = join(repoRoot, '.test-dist');
const compiledTestsDir = join(outDir, 'tests');

execFileSync('npx', ['tsc', '-p', join(repoRoot, 'tsconfig.test.json')], {
  cwd: repoRoot,
  stdio: 'inherit',
});

writeFileSync(join(outDir, 'package.json'), JSON.stringify({ type: 'commonjs' }));

const testFiles = existsSync(compiledTestsDir)
  ? readdirSync(compiledTestsDir)
      .filter((name) => name.endsWith('.test.js'))
      .sort()
      .map((name) => join(compiledTestsDir, name))
  : [];

if (testFiles.length === 0) {
  throw new Error(`no compiled tests found in ${compiledTestsDir}`);
}

execFileSync('node', ['--test', ...testFiles], {
  cwd: repoRoot,
  stdio: 'inherit',
});
