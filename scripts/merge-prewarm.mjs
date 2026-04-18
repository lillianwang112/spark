/**
 * Merges all prewarm batch files into a single src/data/prewarmed.json
 * Run: node scripts/merge-prewarm.mjs
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'prewarm-data');
const OUT_FILE = join(__dirname, '../src/data/prewarmed.json');

mkdirSync(join(__dirname, '../src/data'), { recursive: true });

const merged = {};
let total = 0;
let files = 0;

try {
  const batchFiles = readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
  for (const fname of batchFiles) {
    try {
      const raw = readFileSync(join(DATA_DIR, fname), 'utf8');
      const data = JSON.parse(raw);
      const count = Object.keys(data).length;
      Object.assign(merged, data);
      total += count;
      files++;
      console.log(`  ${fname}: ${count} entries`);
    } catch (err) {
      console.warn(`  Skipping ${fname}: ${err.message}`);
    }
  }
} catch {
  console.warn('No prewarm-data directory found — creating empty prewarmed.json');
}

writeFileSync(OUT_FILE, JSON.stringify(merged, null, 2));
console.log(`\nMerged ${total} entries from ${files} files → src/data/prewarmed.json`);
