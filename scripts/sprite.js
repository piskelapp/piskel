#!/usr/bin/env node

/**
 * Sprite generation script: generates sprite sheets + retina + CSS.
 *
 * Input: src/img/icons/**\/*.png
 * Output: src/img/icons.png, src/img/icons@2x.png, src/css/icons.css
 */

const Spritesmith = require('spritesmith');
const templater = require('spritesheet-templates');
const glob = require('path');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ICONS_DIR = path.resolve(ROOT, 'src/img/icons');
const OUTPUT_IMAGE = path.resolve(ROOT, 'src/img/icons.png');
const OUTPUT_RETINA = path.resolve(ROOT, 'src/img/icons@2x.png');
const OUTPUT_CSS = path.resolve(ROOT, 'src/css/icons.css');

function findPngs(dir, filter) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findPngs(fullPath, filter));
    } else if (entry.isFile() && entry.name.endsWith('.png') && filter(entry.name)) {
      results.push(fullPath);
    }
  }
  return results.sort();
}

function getSpriteName(filePath) {
  // Convert path like src/img/icons/tools/tool-pen.png -> icon-tool-pen
  const relative = path.relative(ICONS_DIR, filePath);
  const parsed = path.parse(relative);
  // spritesheet-templates adds 'icon-' prefix automatically
  return parsed.name.replace(/@2x$/, '');
}

function runSpritesmith(files) {
  return new Promise((resolve, reject) => {
    Spritesmith.run({ src: files }, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

async function main() {
  console.log('Generating sprites...');

  // Find 1x icons (not @2x)
  const normalFiles = findPngs(ICONS_DIR, name => !name.includes('@2x'));
  // Find 2x retina icons
  const retinaFiles = findPngs(ICONS_DIR, name => name.includes('@2x'));

  if (normalFiles.length === 0) {
    console.warn('No icon files found in', ICONS_DIR);
    return;
  }

  // Generate 1x spritesheet
  const normalResult = await runSpritesmith(normalFiles);
  fs.writeFileSync(OUTPUT_IMAGE, normalResult.image);
  console.log(`  Created ${path.relative(ROOT, OUTPUT_IMAGE)} (${normalFiles.length} icons)`);

  // Generate 2x retina spritesheet
  let retinaResult = null;
  if (retinaFiles.length > 0) {
    retinaResult = await runSpritesmith(retinaFiles);
    fs.writeFileSync(OUTPUT_RETINA, retinaResult.image);
    console.log(`  Created ${path.relative(ROOT, OUTPUT_RETINA)} (${retinaFiles.length} icons)`);
  }

  // Generate CSS using spritesheet-templates
  const sprites = Object.entries(normalResult.coordinates).map(([filePath, coords]) => ({
    name: getSpriteName(filePath),
    x: coords.x,
    y: coords.y,
    width: coords.width,
    height: coords.height,
  }));

  const normalCss = templater({
    sprites: sprites,
    spritesheet: {
      width: normalResult.properties.width,
      height: normalResult.properties.height,
      image: '../img/icons.png',
    },
  }, { format: 'css' });

  // Generate retina CSS media query
  let retinaCss = '';
  if (retinaResult) {
    const retinaEntries = sprites.map(sprite => {
      return `  .icon-${sprite.name} {\n    background-image: url(../img/icons@2x.png);\n    background-size: ${normalResult.properties.width}px ${normalResult.properties.height}px;\n  }`;
    });

    retinaCss = `\n@media (-webkit-min-device-pixel-ratio: 2),\n       (min-resolution: 192dpi) {\n${retinaEntries.join('\n')}\n}`;
  }

  const fullCss = normalCss + retinaCss + '\n';
  fs.writeFileSync(OUTPUT_CSS, fullCss);
  console.log(`  Created ${path.relative(ROOT, OUTPUT_CSS)}`);
  console.log('Sprites generated successfully.');
}

main().catch(err => {
  console.error('Sprite generation failed:', err);
  process.exit(1);
});
