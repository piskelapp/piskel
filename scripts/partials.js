#!/usr/bin/env node

/**
 * Website partial generation script.
 *
 * Reads dest/prod/index.html and generates 3 Website-compatible HTML variants
 * for piskelapp.com integration.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const INDEX_PATH = path.resolve(ROOT, 'dest/prod/index.html');
const OUTPUT_DIR = path.resolve(ROOT, 'dest/prod/piskelapp-partials');

function extractAndProcess(html, headerReplacement, footerReplacement) {
  let result = html;

  // Remove everything before body-main-start, replace with header
  result = result.replace(/^(.|[\r\n])*<!--body-main-start-->/, headerReplacement);

  // Remove everything after body-main-end, replace with footer
  result = result.replace(/<!--body-main-end-->(.|[\r\n])*$/, footerReplacement);

  // Decrease indentation by one (2 spaces)
  result = result.replace(/([\r\n])  /g, '$1');

  return result;
}

function main() {
  console.log('Generating Website partials...');

  if (!fs.existsSync(INDEX_PATH)) {
    console.error(`Error: ${INDEX_PATH} not found. Run the build first.`);
    process.exit(1);
  }

  const html = fs.readFileSync(INDEX_PATH, 'utf-8');

  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // 1. main-partial.html (legacy piskelapp.com)
  const mainPartial = extractAndProcess(html, '{% raw %}', '{% endraw %}');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'main-partial.html'), mainPartial);
  console.log('  Created main-partial.html');

  // 2. piskel-web-partial.html (piskelapp.com Website site)
  const webPartial = extractAndProcess(
    html,
    '---\nlayout: "editorLayout.html"\n---\n\n',
    ''
  );
  fs.writeFileSync(path.join(OUTPUT_DIR, 'piskel-web-partial.html'), webPartial);
  console.log('  Created piskel-web-partial.html');

  // 3. piskel-web-partial-kids.html (safe mode)
  const kidsPartial = extractAndProcess(
    html,
    '---\nlayout: "editorLayout.html"\nenableSafeMode: true\n---\n\n',
    ''
  );
  fs.writeFileSync(path.join(OUTPUT_DIR, 'piskel-web-partial-kids.html'), kidsPartial);
  console.log('  Created piskel-web-partial-kids.html');

  console.log('Partials generated successfully.');
}

main();
