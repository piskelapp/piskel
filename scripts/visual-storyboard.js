/**
 * Builds a single HTML page showing every visual test screenshot, grouped by
 * visual area, from the names "area--state.png". The images are embedded, so
 * the page can be shared as one file.
 *
 *   node scripts/visual-storyboard.js [snapshots directory] [output file]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const snapshotsDir = path.resolve(
  process.argv[2] || path.join(ROOT, 'tests/e2e/playwright/visual/snapshots')
);
const outputFile = path.resolve(
  process.argv[3] || path.join(ROOT, 'tests/e2e/playwright/tmp-visual-storyboard/index.html')
);

const escapeHtml = (text) => text.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

const areas = new Map();
for (const file of fs.readdirSync(snapshotsDir).sort()) {
  if (!file.endsWith('.png')) continue;
  const [area, state] = path.basename(file, '.png').split('--');
  if (!areas.has(area)) areas.set(area, []);
  const data = fs.readFileSync(path.join(snapshotsDir, file)).toString('base64');
  areas.get(area).push({ state: state || area, data });
}

const sections = [...areas].map(([area, states]) => `
  <section>
    <h2>${escapeHtml(area)} <small>${states.length}</small></h2>
    <div class="states">${states.map(({ state, data }) => `
      <figure>
        <img src="data:image/png;base64,${data}" alt="${escapeHtml(state)}">
        <figcaption>${escapeHtml(state)}</figcaption>
      </figure>`).join('')}
    </div>
  </section>`).join('');

const total = [...areas.values()].reduce((count, states) => count + states.length, 0);

fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, `<!doctype html>
<meta charset="utf-8">
<title>Piskel visual storyboard</title>
<style>
  body { background: #1d1d1d; color: #eee; font: 14px sans-serif; margin: 24px; }
  h1 { margin: 0 0 4px; }
  h2 { border-bottom: 1px solid #444; margin-top: 32px; padding-bottom: 6px; }
  small { color: #999; font-weight: normal; }
  .states { display: flex; flex-wrap: wrap; gap: 20px; align-items: flex-start; }
  figure { margin: 0; max-width: 100%; }
  img { display: block; max-width: min(640px, 100%); outline: 1px solid #555; }
  figcaption { color: #bbb; font-family: monospace; margin-top: 6px; }
</style>
<h1>Piskel visual storyboard</h1>
<small>${total} screenshots in ${areas.size} areas</small>
${sections}
`);

console.log(`${total} screenshots in ${areas.size} areas: ${path.relative(ROOT, outputFile)}`);
