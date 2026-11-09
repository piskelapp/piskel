/**
 * Turns the application chunk into the packaged files expected by
 * bin/copy-to-piskel-web.js: vendored classic scripts followed by the IIFE
 * bundle, unminified and minified, each with its source map.
 *
 * Also copies the static assets (logo, images, fonts).
 */

const fs = require('fs');
const path = require('path');
const MagicString = require('magic-string');
const remapping = require('@jridgewell/remapping');
const { minify } = require('terser');

const APP_CHUNK = '_app.js';

function walkDir(dir) {
  const results = [];
  if (!fs.existsSync(dir)) {
    return results;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(fullPath));
    } else if (entry.isFile()) {
      results.push(fullPath);
    }
  }
  return results;
}

function bundleClassic({ rootDir, version }) {
  const srcDir = path.resolve(rootDir, 'src');

  return {
    name: 'piskel-bundle-classic',
    enforce: 'post',

    async generateBundle(_options, bundle) {
      const app = bundle[APP_CHUNK];
      if (!app || app.type !== 'chunk') {
        this.error(`Missing the ${APP_CHUNK} chunk`);
      }
      delete bundle[APP_CHUNK];
      delete bundle[`${APP_CHUNK}.map`];
      // Workers are inlined in the bundle, their maps have no use.
      for (const fileName of Object.keys(bundle)) {
        if (/^assets\/.*\.map$/.test(fileName)) {
          delete bundle[fileName];
        }
      }

      const packaged = `js/piskel-packaged${version}.js`;
      const minified = `js/piskel-packaged-min${version}.js`;

      // The vendored files first, then the application.
      const concat = new MagicString.Bundle({ separator: ';' });
      const { vendors } = require(path.resolve(srcDir, 'vendor-list.js'));
      for (const relPath of vendors) {
        const content = fs.readFileSync(path.resolve(srcDir, relPath), 'utf-8');
        concat.addSource({
          filename: relPath,
          content: new MagicString(content, { filename: relPath })
        });
      }
      concat.addSource({
        filename: APP_CHUNK,
        content: new MagicString(app.code, { filename: APP_CHUNK })
      });

      const code = concat.toString();
      const concatMap = concat.generateMap({
        file: packaged,
        includeContent: true,
        hires: 'boundary'
      });
      // Chain the map of the concatenation with the one of the application.
      const map = remapping(concatMap.toString(), (file) =>
        // Paths are relative to the bundle, in the js/ folder.
        path.basename(file) === APP_CHUNK ? app.map : null
      ).toString();

      this.emitFile({
        type: 'asset',
        fileName: packaged,
        source: `${code}\n//# sourceMappingURL=${path.basename(packaged)}.map`
      });
      this.emitFile({ type: 'asset', fileName: `${packaged}.map`, source: map });

      const result = await minify(code, {
        mangle: true,
        sourceMap: {
          content: map,
          url: `${path.basename(minified)}.map`
        }
      });
      this.emitFile({ type: 'asset', fileName: minified, source: result.code });
      this.emitFile({
        type: 'asset',
        fileName: `${minified}.map`,
        source: result.map
      });

      // Static assets. CSS url() references may already have emitted some.
      const staticFiles = [
        path.resolve(srcDir, 'logo.png'),
        ...walkDir(path.resolve(srcDir, 'img')),
        ...walkDir(path.resolve(srcDir, 'css/fonts'))
      ];
      for (const fullPath of staticFiles) {
        const fileName = path.relative(srcDir, fullPath).split(path.sep).join('/');
        if (!bundle[fileName]) {
          this.emitFile({
            type: 'asset',
            fileName,
            source: fs.readFileSync(fullPath)
          });
        }
      }
    }
  };
}

module.exports = bundleClassic;
module.exports.APP_CHUNK = APP_CHUNK;
