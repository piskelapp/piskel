#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const minimist = require('minimist');
const childProcess = require('child_process');
const phantomjs = require('phantomjs');
const binPath = phantomjs.path;

// Parse command args
let args = minimist(process.argv.slice(2), {
  default: {
    crop: false,
    dataUri: false,
    debug: false,
    scale: 1
  },
});

if (args.debug) console.log(args);

// Ensure a path for the src file was passed
if (!args._ || (args._ && !args._.length)) {
  console.error('Path to a .piskel file is required');

  return;
}

const src = args._[0];

// Ensure the src file exists
if (!fs.existsSync(src)) {
  console.error('No such file: ' + src);

  return;
}

// Read src piskel file
const piskelFile = fs.readFileSync(src, 'utf-8');

const dest = args.dest || path.basename(src, '.piskel');

console.log('Piskel CLI is exporting...');

// Get path to Piskel's app js bundle
let piskelAppJsDir = path.resolve(__dirname +'/../dest/prod/js/');
let minJsFiles = fs.readdirSync(piskelAppJsDir).filter(filename => filename.indexOf('min') > -1);
let piskelAppJsFileName = minJsFiles[0];
let piskelAppJsPath = (piskelAppJsFileName) ? path.join(piskelAppJsDir, piskelAppJsFileName) : '';

if (!fs.existsSync(piskelAppJsPath)) {
  console.error(`Piskel's application JS file not found in: ${piskelAppJsDir}. Run prod build and try again.`);

  return;
}

// Prepare args to pass to phantom script
const options = {
  dest: dest,
  zoom: args.scale,
  crop: !!args.crop,
  rows: args.rows,
  columns: args.columns,
  frame: args.frame,
  dataUri: !!args.dataUri,
  debug: args.debug,
  piskelAppJsPath: piskelAppJsPath,
  scaledWidth: args.scaledWidth,
  scaledHeight: args.scaledHeight
};

const childArgs = [
  path.join(__dirname, 'piskel-export.js'),
  piskelFile,
  JSON.stringify(options)
];

if (args.debug) {
  childArgs.unshift(
    '--remote-debugger-port=9035',
    '--remote-debugger-autorun=yes'
  );
}

// Run phantom script
childProcess.execFile(binPath, childArgs, function (err, stdout, stderr) {
  // Print any output the from child process
  if (err) console.log(err);
  if (stderr) console.log(stderr);
  if (stdout) console.log(stdout);

  console.log('Export complete');
});