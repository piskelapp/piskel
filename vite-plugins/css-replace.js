/**
 * Vite plugin that replaces var(--highlight-color) with 'gold'
 * in CSS output during production builds.
 *
 */

function cssReplace() {
  return {
    name: 'piskel-css-replace',
    enforce: 'post',

    generateBundle(options, bundle) {
      for (const [fileName, chunk] of Object.entries(bundle)) {
        // Apply CSS variable replacement to any CSS assets
        if (fileName.endsWith('.css') && chunk.type === 'asset' && typeof chunk.source === 'string') {
          chunk.source = chunk.source
            .replace(/var\(--highlight-color\)/g, 'gold')
            // Placeholder left by Vite at the end of the stylesheet.
            .replace(/\n?\/\*\$vite\$:\d+\*\//g, '');
        }
      }

    },
  };
}

module.exports = cssReplace;
