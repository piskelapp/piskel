const rmdir = require('rmdir');
const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');

const PISKEL_PATH = path.resolve(__dirname, '..');
const PISKELAPP_PATH = path.resolve(__dirname, '../../piskel-website');

// Callbacks sorted by call sequence.
function onCopy(err) {
  if (err) {
    console.error('Failed to copy static files...');
    return console.error(err);
  }

  console.log('Copied static files to piskel-website...');
  let previousPartialPath = path.resolve(PISKELAPP_PATH, 'templates/editor/main-partial.html');
  fs.unlink(previousPartialPath, onDeletePreviousPartial);
}

function onDeletePreviousPartial(err) {
  if (err) {
    console.error('Failed to delete previous main partial...');
    return console.error(err);
  }

  console.log('Previous main partial deleted...');
  fse.copy(
    path.resolve(PISKELAPP_PATH, "static/editor/piskelapp-partials/main-partial.html"),
    path.resolve(PISKELAPP_PATH, "templates/editor/main-partial.html"),
    onCopyNewPartial
  );
}

function onCopyNewPartial(err) {
  if (err) {
    console.error('Failed to delete previous main partial...');
    return console.error(err);
  }

  console.log('Main partial copied...');
  rmdir(
    path.resolve(PISKELAPP_PATH, "static/editor/piskelapp-partials/"),
    onDeleteTempPartial
  );
}

function onDeleteTempPartial(err) {
  if (err) {
    console.error('Failed to delete temporary main partial...');
    return console.error(err);
  }

  console.log('Temporary main partial deleted...');
  console.log('Finished!');
}

fse.copy(
  path.resolve(PISKEL_PATH, "dest/prod"),
  path.resolve(PISKELAPP_PATH, "static/editor"),
  onCopy
);