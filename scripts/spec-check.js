#!/usr/bin/env node

/**
 * Spec coverage check.
 *
 * Every claim in docs/specs/<spec>.md starts with an id in inline code,
 * either as a bullet ("- `layers.rename` ...") or as the first cell of a
 * table row ("| `drawing-tools.pen` | ..."). Ids are scoped by spec: the
 * part before the first dot is the spec file name.
 *
 * Playwright tests reference ids with tags: { tag: ['@layers.rename'] }.
 *
 * Fails on duplicate or badly scoped ids, and on tests referencing ids that
 * don't exist. Lists the ids that no test references (the test gaps).
 *
 * Usage: node scripts/spec-check.js [--quiet]
 *   --quiet  don't list untested ids, only print their count.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SPECS_DIR = path.resolve(ROOT, 'docs/specs');
const TESTS_DIR = path.resolve(ROOT, 'tests/e2e/playwright');

const ID = '[a-z0-9-]+(?:\\.[a-z0-9-]+)+';
const CLAIM_RE = new RegExp('^\\s*(?:- |\\| )`(' + ID + ')`');
const TAG_RE = new RegExp('[\'"`]@(' + ID + ')[\'"`]', 'g');

const quiet = process.argv.includes('--quiet');
const errors = [];

function relative(file) {
  return path.relative(ROOT, file);
}

function listFiles(dir, filter) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return listFiles(file, filter);
    }
    return filter(file) ? [file] : [];
  });
}

// Collect the claim ids declared in the specs.
const claims = new Map(); // id -> "file:line"
const specFiles = fs
  .readdirSync(SPECS_DIR)
  .filter((name) => name.endsWith('.md') && name !== 'README.md')
  .map((name) => path.join(SPECS_DIR, name));

for (const file of specFiles) {
  const spec = path.basename(file, '.md');
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, index) => {
    const match = CLAIM_RE.exec(line);
    if (!match) {
      return;
    }
    const id = match[1];
    const location = relative(file) + ':' + (index + 1);
    if (id.split('.')[0] !== spec) {
      errors.push(location + ': id `' + id + '` should start with "' + spec + '."');
    }
    if (claims.has(id)) {
      errors.push(location + ': duplicate id `' + id + '` (first at ' + claims.get(id) + ')');
      return;
    }
    claims.set(id, location);
  });
}

// Collect the ids referenced by test tags.
const tested = new Set();
const testFiles = listFiles(TESTS_DIR, (file) => file.endsWith('.ts'));

for (const file of testFiles) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, index) => {
    for (const match of line.matchAll(TAG_RE)) {
      const id = match[1];
      if (!claims.has(id)) {
        errors.push(relative(file) + ':' + (index + 1) + ': unknown spec id @' + id);
        continue;
      }
      tested.add(id);
    }
  });
}

// Report.
const untested = [...claims.keys()].filter((id) => !tested.has(id));
console.log(
  claims.size + ' spec claims, ' + tested.size + ' referenced by tests, ' +
  untested.length + ' untested.'
);
if (!quiet && untested.length) {
  console.log('\nUntested claims:');
  for (const id of untested) {
    console.log('  ' + id + '  (' + claims.get(id) + ')');
  }
}

if (errors.length) {
  console.error('\n' + errors.length + ' error(s):');
  for (const error of errors) {
    console.error('  ' + error);
  }
  process.exit(1);
}
