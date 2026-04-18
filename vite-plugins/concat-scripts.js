/**
 * Rollup/Vite plugin that concatenates scripts and styles in order.
 *
 * Reads piskel-script-list.js and piskel-style-list.js (Node-compatible)
 * and emits concatenated bundles with versioned filenames.
 */

const fs = require('fs');
const path = require('path');
const dateFormat = require('dateformat');
const MagicString = require('magic-string');

function concatScripts(options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const srcDir = path.resolve(rootDir, 'src');
  const version = '-' + dateFormat(new Date(), 'yyyy-mm-dd-hh-MM');

  function readFileList(listFile, property) {
    const listPath = path.resolve(srcDir, listFile);
    delete require.cache[listPath];
    return require(listPath)[property];
  }

  /**
   * Concatenate files with source map tracking.
   * Returns { code, map } where map is a v3 source map object.
   */
  function concatWithSourceMap(paths, separator, mapFileName) {
    const bundle = new MagicString.Bundle({ separator });

    for (const relPath of paths) {
      const fullPath = path.resolve(srcDir, relPath);
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const s = new MagicString(content, { filename: relPath });
        bundle.addSource({ content: s, filename: relPath });
      } catch (err) {
        console.warn(`[concat-scripts] Could not read: ${fullPath}`);
      }
    }

    return {
      code: bundle.toString(),
      map: bundle.generateMap({
        file: mapFileName,
        source: mapFileName,
        includeContent: true, // embed original sources in the map
        hires: false,
      }),
    };
  }

  function readAndConcat(paths, separator) {
    return paths.map(relPath => {
      const fullPath = path.resolve(srcDir, relPath);
      try {
        return fs.readFileSync(fullPath, 'utf-8');
      } catch (err) {
        console.warn(`[concat-scripts] Could not read: ${fullPath}`);
        return null;
      }
    }).filter(content => content !== null).join(separator);
  }

  function walkDir(dir) {
    const results = [];
    if (!fs.existsSync(dir)) {
      return results;
    }
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...walkDir(fullPath));
      } else if (entry.isFile()) {
        results.push(fullPath);
      }
    }
    return results;
  }

  return {
    name: 'piskel-concat-scripts',

    async generateBundle() {
      const scriptPaths = readFileList('piskel-script-list.js', 'scripts');
      const stylePaths = readFileList('piskel-style-list.js', 'styles');

      // --- JS with source maps ---
      const jsPackaged = `js/piskel-packaged${version}.js`;
      const jsMinified = `js/piskel-packaged-min${version}.js`;

      const concat = concatWithSourceMap(scriptPaths, ';', jsPackaged);

      // Emit unminified JS bundle + source map
      const concatMapFileName = jsPackaged + '.map';
      this.emitFile({
        type: 'asset',
        fileName: jsPackaged,
        source: concat.code + `\n//# sourceMappingURL=${path.basename(concatMapFileName)}`,
      });
      this.emitFile({
        type: 'asset',
        fileName: concatMapFileName,
        source: concat.map.toString(),
      });

      // Minify with terser, chaining the concat source map so the
      // minified bundle maps back to original source files
      const { minify } = require('terser');
      const minResult = await minify(concat.code, {
        mangle: true,
        sourceMap: {
          content: concat.map.toString(),
          url: path.basename(jsMinified) + '.map',
        },
      });
      if (minResult.code) {
        this.emitFile({
          type: 'asset',
          fileName: jsMinified,
          source: minResult.code,
        });
        this.emitFile({
          type: 'asset',
          fileName: jsMinified + '.map',
          source: minResult.map,
        });
      }

      // --- CSS ---
      const concatenatedCss = readAndConcat(stylePaths, '\n');
      // Apply CSS variable replacement (var(--highlight-color) -> gold)
      const processedCss = concatenatedCss.replace(/var\(--highlight-color\)/g, 'gold');

      this.emitFile({
        type: 'asset',
        fileName: `css/piskel-style-packaged${version}.css`,
        source: processedCss,
      });

      // --- Static assets ---
      const singleFiles = [
        { src: 'logo.png', dest: 'logo.png' },
      ];

      for (const asset of singleFiles) {
        const fullPath = path.resolve(srcDir, asset.src);
        try {
          this.emitFile({
            type: 'asset',
            fileName: asset.dest,
            source: fs.readFileSync(fullPath),
          });
        } catch (err) {
          this.warn(`Could not copy asset: ${fullPath}`);
        }
      }

      // Copy directories: img/** and css/fonts/**
      for (const subDir of ['img', 'css/fonts']) {
        const files = walkDir(path.resolve(srcDir, subDir));
        for (const fullPath of files) {
          const relativePath = path.relative(srcDir, fullPath);
          try {
            this.emitFile({
              type: 'asset',
              fileName: relativePath,
              source: fs.readFileSync(fullPath),
            });
          } catch (err) {
            this.warn(`Could not copy file: ${fullPath}`);
          }
        }
      }
    },
  };
}

module.exports = concatScripts;
module.exports.getVersion = function () {
  return '-' + dateFormat(new Date(), 'yyyy-mm-dd-hh-MM');
};
