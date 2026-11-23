#!/usr/bin/env node

/**
 * NW.js desktop packaging script.
 *
 * Usage:
 *   node scripts/desktop.js                          # Build for Windows + Linux
 *   node scripts/desktop.js --platform=macos         # Build for macOS

 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DESKTOP_DIR = path.resolve(ROOT, 'dest/desktop');
const CACHE_DIR = path.resolve(ROOT, 'cache');
const releaseVersion = require(path.resolve(ROOT, 'package.json')).version;

// Parse --platform argument
const args = process.argv.slice(2);
const platformArg = args.find(a => a.startsWith('--platform='));
const platform = platformArg ? platformArg.split('=')[1] : 'windows-linux';

// Source directories: prod build + package.json (relative globs for nw-builder v4)
const srcDir = 'dest/prod/**/* package.json';

const NW_VERSION = '0.110.1';

const configs = {
  'windows-linux': {
    version: NW_VERSION,
    flavor: 'normal',
    targets: [
      { platform: 'win', arch: 'ia32' },
      { platform: 'win', arch: 'x64' },
      { platform: 'linux', arch: 'ia32' },
      { platform: 'linux', arch: 'x64' },
    ],
    outDir: DESKTOP_DIR,
  },
  macos: {
    version: NW_VERSION,
    flavor: 'normal',
    targets: [{ platform: 'osx', arch: 'x64' }],
    outDir: DESKTOP_DIR,
    app: {
      name: 'Piskel',
      icon: './misc/desktop/nw.icns',
      LSApplicationCategoryType: 'public.app-category.graphics-design',
      CFBundleIdentifier: 'com.piskelapp.piskel',
      CFBundleName: 'Piskel',
      CFBundleDisplayName: 'Piskel',
      CFBundleSpokenName: 'Piskel',
      CFBundleVersion: releaseVersion,
      CFBundleShortVersionString: releaseVersion,
      NSHumanReadableCopyright: 'Copyright 2025 Piskel contributors',
      NSLocalNetworkUsageDescription: 'Piskel does not access the local network',
    },
  },
};

/**
 * Pre-download NW.js binaries using curl (handles redirects reliably).
 * nw-builder's built-in downloader fails on redirecting servers.
 */
function ensureCached(version, flavor, plat, arch) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });

  var prefix = flavor === 'sdk' ? 'nwjs-sdk' : 'nwjs';
  var ext = plat === 'linux' ? 'tar.gz' : 'zip';
  var filename = prefix + '-v' + version + '-' + plat + '-' + arch + '.' + ext;
  var filePath = path.resolve(CACHE_DIR, filename);

  if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
    console.log('    Using cached: ' + filename);
    return;
  }

  var url = 'https://dl.nwjs.io/v' + version + '/' + filename;
  console.log('    Downloading: ' + url);
  execSync('curl -L -f -o "' + filePath + '" "' + url + '"', {
    stdio: 'inherit',
    timeout: 300000,
  });
}

function ensureShasums(version) {
  var shasumDir = path.resolve(CACHE_DIR, 'shasum');
  fs.mkdirSync(shasumDir, { recursive: true });
  var filePath = path.resolve(shasumDir, version + '.txt');

  if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
    console.log('  Using cached SHASUMS');
    return;
  }

  var url = 'https://dl.nwjs.io/v' + version + '/SHASUMS256.txt';
  console.log('  Downloading SHASUMS: ' + url);
  execSync('curl -L -f -o "' + filePath + '" "' + url + '"', {
    stdio: 'inherit',
    timeout: 30000,
  });
}

async function main() {
  var config = configs[platform];
  if (!config) {
    console.error('Unknown platform: ' + platform + '. Valid: windows-linux, macos');
    process.exit(1);
  }

  // Clean desktop output
  if (fs.existsSync(DESKTOP_DIR)) {
    fs.rmSync(DESKTOP_DIR, { recursive: true });
  }
  fs.mkdirSync(config.outDir, { recursive: true });

  console.log('Building desktop app for ' + platform + '...');
  console.log('  nw.js version: ' + config.version);
  console.log('  Output: ' + config.outDir);

  // Pre-download all binaries and SHASUMS with curl
  // (nw-builder's built-in downloader fails on redirecting servers)
  for (var target of config.targets) {
    console.log('\n  Downloading ' + target.platform + '-' + target.arch + '...');
    ensureCached(config.version, config.flavor, target.platform, target.arch);
  }
  ensureShasums(config.version);

  // nw-builder v4 is ESM-only
  var nwbuild = (await import('nw-builder')).default;

  for (var target of config.targets) {
    var targetOutDir = path.resolve(config.outDir, target.platform + '-' + target.arch);
    console.log('\n  Building ' + target.platform + '-' + target.arch + '...');
    var nwOptions = {
      mode: 'build',
      version: config.version,
      flavor: config.flavor,
      platform: target.platform,
      arch: target.arch,
      srcDir: srcDir,
      outDir: targetOutDir,
      cacheDir: CACHE_DIR,
      downloadUrl: 'https://dl.nwjs.io/',
      manifestUrl: 'https://nwjs.io/versions.json',
      glob: true,
      shaSum: false,
      logLevel: 'info',
    };
    if (config.app) {
      nwOptions.app = config.app;
    }
    await nwbuild(nwOptions);
  }

  console.log('\nDesktop build complete.');
}

main().catch(function (err) {
  console.error('Desktop build failed:', err);
  process.exit(1);
});
