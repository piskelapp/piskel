#!/usr/bin/env node

/**
 * Piskel server. Serves the production build with live reload.
 *
 * - CSS changes: hot-injected (no page refresh)
 * - JS/HTML changes: rebuild + auto-refresh
 * - --test flag: no live reload, no watching (for E2E tests)
 *
 * Usage:
 *   node scripts/serve.js          # Serve with live reload (port 9001)
 *   node scripts/serve.js --test   # Test server (port 9001, no watch, no live reload)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const isTest = process.argv.includes('--test');
const PORT = 9001;
const ROOT = path.resolve(__dirname, '..', 'dest/prod');

const MIME_TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject', '.map': 'application/json',
};

// --- Live Reload via Server-Sent Events (SSE) ---
let sseClients = [];

function sseSend(data) {
  const msg = `data: ${JSON.stringify(data)}\n\n`;
  for (const res of sseClients) {
    try { res.write(msg); } catch (e) { /* client gone */ }
  }
}

const LIVE_RELOAD_SCRIPT = `
<script>
(function() {
  var es = new EventSource('/__live-reload');
  es.onmessage = function(e) {
    var msg = JSON.parse(e.data);
    if (msg.type === 'reload') {
      location.reload();
    } else if (msg.type === 'css') {
      var links = document.querySelectorAll('link[rel="stylesheet"]');
      links.forEach(function(link) {
        var href = link.getAttribute('href').split('?')[0];
        link.setAttribute('href', href + '?t=' + Date.now());
      });
      console.log('[live-reload] CSS updated');
    }
  };
  es.onerror = function() {
    console.log('[live-reload] Disconnected, will retry...');
  };
})();
</script>
`;

// --- Static file serving ---
function findFile(urlPath) {
  const filePath = path.join(ROOT, urlPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return filePath;
  }
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    const indexPath = path.join(filePath, 'index.html');
    if (fs.existsSync(indexPath)) return indexPath;
  }
  return null;
}

function injectLiveReload(html) {
  if (isTest) return html;
  const idx = html.lastIndexOf('</body>');
  if (idx === -1) return html;
  return html.slice(0, idx) + LIVE_RELOAD_SCRIPT + html.slice(idx);
}

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(new URL(req.url, `http://localhost:${PORT}`).pathname);
  if (urlPath === '/') urlPath = '/index.html';

  // SSE endpoint for live reload
  if (urlPath === '/__live-reload' && !isTest) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });
    res.write('\n');
    sseClients.push(res);
    req.on('close', () => {
      sseClients = sseClients.filter(c => c !== res);
    });
    return;
  }

  const filePath = findFile(urlPath);
  if (!filePath) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  try {
    let content = fs.readFileSync(filePath);
    if (ext === '.html') {
      content = injectLiveReload(content.toString());
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
});

server.listen(PORT, 'localhost', () => {
  console.log(`Piskel server running at http://localhost:${PORT}/`);
  if (!isTest) {
    console.log('Live reload: enabled (CSS hot-swap, JS auto-refresh)');
  }
  console.log(`Serving: ${ROOT}`);
});

// --- File watching (not in test mode) ---
if (!isTest) {
  let rebuildTimeout = null;
  let isRebuilding = false;
  const srcDir = path.resolve(__dirname, '..', 'src');

  try {
    fs.watch(srcDir, { recursive: true }, (eventType, filename) => {
      if (!filename || isRebuilding) return;
      if (rebuildTimeout) clearTimeout(rebuildTimeout);

      rebuildTimeout = setTimeout(() => {
        const ext = path.extname(filename).toLowerCase();
        const isCssOnly = ext === '.css';

        console.log(`\nFile changed: ${filename}`);
        console.log('Rebuilding...');
        isRebuilding = true;
        exec('npm run build', { cwd: path.resolve(__dirname, '..') }, (err) => {
          isRebuilding = false;
          if (err) { console.error('Build failed'); return; }
          if (isCssOnly) {
            console.log('Build complete. Hot-swapping CSS...');
            sseSend({ type: 'css' });
          } else {
            console.log('Build complete. Reloading browser...');
            sseSend({ type: 'reload' });
          }
        });
      }, 300);
    });
    console.log('Watching src/ for changes...');
  } catch (err) {
    console.warn('File watching not available:', err.message);
  }
}
