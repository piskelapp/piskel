#!/usr/bin/env node

/**
 * Checks the TypeScript rules Biome doesn't cover, and that src/js stays
 * free of the old module system.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC_JS = path.join(ROOT, 'src/js');
const LIB = path.join(SRC_JS, 'lib') + path.sep;

const FORBIDDEN = [
  { name: '@ts-nocheck', pattern: /@ts-nocheck/ },
  { name: '@ts-expect-error', pattern: /@ts-expect-error/ },
  { name: 'as unknown as', pattern: /\bas\s+unknown\s+as\b/ },
  { name: 'field!: declaration', pattern: /^\s*(?:[a-z]+\s+)*[\w$]+!\s*:/ }
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

const errors = [];
const report = (file, line, message) => {
  errors.push(`${path.relative(ROOT, file)}:${line}: ${message}`);
};

const checked = [...walk(path.join(ROOT, 'src')), ...walk(path.join(ROOT, 'tests/unit-tests'))];

for (const file of checked) {
  const isVendorCode = file.startsWith(LIB) && !file.endsWith('.d.ts');
  if (isVendorCode) {
    continue;
  }

  if (file.startsWith(SRC_JS) && file.endsWith('.js')) {
    report(file, 1, 'src/js only contains TypeScript outside of src/js/lib');
  }

  if (!/\.(ts|js)$/.test(file)) {
    continue;
  }

  fs.readFileSync(file, 'utf-8')
    .split('\n')
    .forEach((text, index) => {
      for (const { name, pattern } of FORBIDDEN) {
        if (pattern.test(text)) {
          report(file, index + 1, `forbidden pattern: ${name}`);
        }
      }
      if (text.includes('$.namespace')) {
        report(file, index + 1, 'forbidden pattern: $.namespace');
      }
    });
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}
