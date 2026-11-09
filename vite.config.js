const path = require('path');
const dateFormat = require('dateformat');
const bundleClassic = require('./vite-plugins/bundle-classic');
const htmlInclude = require('./vite-plugins/html-include');
const cssReplace = require('./vite-plugins/css-replace');

// Computed once per build, so that all the emitted names share it.
const version = '-' + dateFormat(new Date(), 'yyyy-mm-dd-hh-MM');
const srcDir = path.resolve(__dirname, 'src');

/** @type {import('vite').UserConfig} */
module.exports = {
  // CSS url() are written relative to the stylesheet.
  base: './',
  // index.html is produced by the html-include plugin.
  publicDir: false,

  plugins: [
    htmlInclude({ rootDir: __dirname, version }),
    bundleClassic({ rootDir: __dirname, version }),
    cssReplace()
  ],

  build: {
    outDir: path.resolve(__dirname, 'dest/prod'),
    emptyOutDir: true,
    target: 'es2020',
    sourcemap: true,
    cssCodeSplit: false,
    cssMinify: false,
    // The bundle is minified by the bundle-classic plugin.
    minify: false,
    assetsInlineLimit: 0,
    rollupOptions: {
      input: path.resolve(srcDir, 'js/main.ts'),
      output: {
        format: 'iife',
        entryFileNames: bundleClassic.APP_CHUNK,
        codeSplitting: false,
        assetFileNames(assetInfo) {
          if (assetInfo.names.some((name) => name.endsWith('.css'))) {
            return `css/piskel-style-packaged${version}.css`;
          }
          // Assets referenced by the CSS keep their path in src.
          const original = (assetInfo.originalFileNames || [])[0];
          if (original) {
            return original.replace(/^src\//, '');
          }
          return 'assets/[name][extname]';
        }
      }
    }
  },

  worker: {
    format: 'iife'
  }
};
