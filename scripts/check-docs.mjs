/**
 * Docs check: fail when README.md or docs/*.md name a src/ path that does not exist.
 * Checks inline paths such as `src/utils/scoring.ts` and every entry in the README's
 * project structure tree.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));

const docFiles = [
  join(repoRoot, 'README.md'),
  ...readdirSync(join(repoRoot, 'docs'))
    .filter((name) => name.endsWith('.md'))
    .map((name) => join(repoRoot, 'docs', name)),
];

const problems = [];

/** Inline references: any src/... token outside a word or path. */
function checkInlinePaths(file, text) {
  const pattern = /(?<![\w./-])src\/[\w./-]*/g;
  for (const [index, line] of text.split('\n').entries()) {
    for (const match of line.matchAll(pattern)) {
      const path = match[0].replace(/[.,;:]+$/, '');
      if (!existsSync(join(repoRoot, path))) {
        problems.push(`${relative(repoRoot, file)}:${index + 1}: ${path} does not exist`);
      }
    }
  }
}

/** Tree blocks: lines like "│   ├── name   # comment", four columns per level. */
function checkTrees(file, text) {
  const lines = text.split('\n');
  const stack = [];
  let inFence = false;
  let isTree = false;

  for (const [index, line] of lines.entries()) {
    if (line.startsWith('```')) {
      inFence = !inFence;
      isTree = false;
      stack.length = 0;
      continue;
    }
    if (!inFence) continue;

    const marker = line.search(/[├└]── /);
    if (marker === -1) {
      // The first line of a tree is the repo root, e.g. "proxguard/"
      isTree = isTree || /^[\w.-]+\/\s*$/.test(line.trim());
      continue;
    }
    if (!isTree) continue;

    const depth = marker / 4;
    const name = line
      .slice(marker + 4)
      .replace(/#.*$/, '')
      .trim()
      .replace(/\/$/, '');
    stack.length = depth;
    stack.push(name);

    const path = stack.join('/');
    if (!existsSync(join(repoRoot, path))) {
      problems.push(`${relative(repoRoot, file)}:${index + 1}: ${path} (project tree) does not exist`);
    }
  }
}

for (const file of docFiles) {
  const text = readFileSync(file, 'utf8');
  checkInlinePaths(file, text);
  checkTrees(file, text);
}

if (problems.length > 0) {
  console.error('Docs name paths that do not exist:');
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

console.log(`check-docs: ${docFiles.length} files, every named path exists`);
