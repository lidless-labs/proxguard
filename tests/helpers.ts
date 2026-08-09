import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const fixturesDir = join(__dirname, '../../tests/fixtures');

export function readFixture(name: string): string {
  return readFileSync(join(fixturesDir, name), 'utf8');
}
