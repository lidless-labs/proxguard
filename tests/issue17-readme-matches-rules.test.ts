/**
 * Regression: issue #17: README rule tables must match the code.
 * Pinned production: allRules, CATEGORY_WEIGHTS in src/utils/scoring.ts.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { allRules } from '../src/rules/index';

const repoRoot = join(__dirname, '../..');
const readme = readFileSync(join(repoRoot, 'README.md'), 'utf8');

/** Body rows of the first markdown table after a heading, as trimmed cells. */
function tableAfter(heading: string, text = readme): string[][] {
  const start = text.indexOf(heading);
  assert.notEqual(start, -1, `README has no "${heading}" heading`);

  const rows: string[][] = [];
  for (const line of text.slice(start).split('\n').slice(1)) {
    if (line.startsWith('|')) {
      rows.push(line.split('|').slice(1, -1).map((cell) => cell.trim()));
    } else if (rows.length > 0) {
      break;
    }
  }
  // Drop the header and the |---| separator
  return rows.slice(2);
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

test('README CIS mapping table lists exactly the rules in allRules', () => {
  const documented = tableAfter('### CIS benchmark mapping')
    .map(([title, severity, benchmark]) => `${title} | ${severity} | ${benchmark}`)
    .sort();
  const actual = allRules
    .map((rule) => `${rule.title} | ${capitalize(rule.severity)} | ${rule.cisBenchmark}`)
    .sort();

  assert.deepEqual(documented, actual);
});

test('README rule and category counts match allRules', () => {
  const categories = new Set(allRules.map((rule) => rule.category));
  assert.match(readme, new RegExp(`${allRules.length} security rules across ${categories.size} categories`));
  assert.match(readme, new RegExp(`${allRules.length} rules in ${categories.size} categories`));
});

test('README category weights match CATEGORY_WEIGHTS', () => {
  const scoring = readFileSync(join(repoRoot, 'src/utils/scoring.ts'), 'utf8');
  const block = scoring.match(/CATEGORY_WEIGHTS[^{]*\{([^}]*)\}/);
  assert.ok(block, 'CATEGORY_WEIGHTS not found in src/utils/scoring.ts');

  const actual: Record<string, number> = {};
  for (const [, category, weight] of block[1].matchAll(/(\w+):\s*(\d+)/g)) {
    actual[category] = Number(weight);
  }

  const labels: Record<string, string> = {
    SSH: 'ssh',
    Firewall: 'firewall',
    Authentication: 'auth',
    Container: 'container',
    Storage: 'storage',
    API: 'api',
  };
  const documented: Record<string, number> = {};
  for (const [label, weight] of tableAfter('## How the scoring works')) {
    const category = labels[label.replace(/\*/g, '')];
    assert.ok(category, `unknown category label ${label}`);
    documented[category] = Number(weight.replace('%', ''));
  }

  assert.deepEqual(documented, actual);
});


test('architecture rule counts match the current registry by category', () => {
  const architecture = readFileSync(join(repoRoot, 'docs/ARCHITECTURE.md'), 'utf8');
  const actual: Record<string, number> = {};
  for (const rule of allRules) actual[rule.category] = (actual[rule.category] ?? 0) + 1;
  const documented = Object.fromEntries(
    tableAfter('### Rules', architecture).map(([category, , count]) => [
      category.replace(/`/g, ''), Number(count),
    ]),
  );
  assert.deepEqual(documented, actual);
  assert.match(architecture, new RegExp(`There are ${allRules.length} rules in ${Object.keys(actual).length} categories`));
});
