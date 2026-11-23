/**
 * Vite plugin that processes @@include() directives and @@variable
 * replacements in src/index.html, then emits the result as index.html.
 */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function htmlInclude(options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const srcDir = path.resolve(rootDir, 'src');
  const version = options.version;
  const releaseVersion = require(path.resolve(rootDir, 'package.json')).version;

  function resolveIncludes(content, baseDir) {
    // Match @@include('path', {}) or @@include('path',{})
    const includeRegex = /@@include\(\s*'([^']+)'\s*,\s*\{[^}]*\}\s*\)/g;

    return content.replace(includeRegex, (match, includePath) => {
      const fullPath = path.resolve(baseDir, includePath);
      try {
        let included = fs.readFileSync(fullPath, 'utf-8');
        if (fullPath.endsWith('.ts')) {
          included = ts.transpileModule(included, {
            compilerOptions: {
              target: ts.ScriptTarget.ES2020,
              module: ts.ModuleKind.None,
              removeComments: false
            }
          }).outputText.replace(/\n$/, '');
        }
        // Recursively resolve includes in the included file
        included = resolveIncludes(included, path.dirname(fullPath));
        return included;
      } catch (err) {
        console.warn(`[html-include] Could not read: ${fullPath}`);
        return match;
      }
    });
  }

  function replaceVariables(content) {
    return content
      .replace(/@@version/g, version)
      .replace(/@@releaseVersion/g, releaseVersion);
  }

  // Expose the processed HTML for other scripts (partials.js)
  let processedHtml = null;

  return {
    name: 'piskel-html-include',

    generateBundle() {
      const indexPath = path.resolve(srcDir, 'index.html');
      let html = fs.readFileSync(indexPath, 'utf-8');
      html = resolveIncludes(html, srcDir);
      html = replaceVariables(html);
      processedHtml = html;

      this.emitFile({
        type: 'asset',
        fileName: 'index.html',
        source: html,
      });
    },

    // Allow other code to access the processed HTML
    api: {
      getProcessedHtml() { return processedHtml; },
      getVersion() { return version; },
      getReleaseVersion() { return releaseVersion; },
    },
  };
}

module.exports = htmlInclude;
