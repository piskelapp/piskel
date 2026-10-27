# Desktop app, CLI and embedding

## Purpose

Run Piskel outside the browser (desktop app), from scripts (CLI), and
inside piskelapp.com (embedding).

## Behavior

### Desktop app (NW.js)

- `desktop-and-cli.desktop-build` The same `dest/prod` build is packaged
  with NW.js for Windows and Linux (32 and 64-bit) and macOS, with
  `npm run build:desktop` (Windows + Linux) or `npm run build:mac`, output
  in `dest/desktop/`. `npm run start:nw` runs the app locally. The window
  settings come from the `window` field in `package.json`.
- `desktop-and-cli.desktop-files` On desktop, sprites are saved to and
  opened from the filesystem (see
  [save-and-storage.md](save-and-storage.md)).
- `desktop-and-cli.desktop-menu` On macOS, the desktop app has a native
  menu bar.
- `desktop-and-cli.desktop-close-confirm` Closing the desktop window with
  unsaved changes asks for confirmation.

### CLI (`piskel-cli`)

- `desktop-and-cli.cli` Exports a `.piskel` file to a PNG spritesheet from
  the command line, with options for scale, target width/height,
  rows/columns, a single frame, cropping, a data-URI output and the
  destination. Usage is documented in `cli/README.md`.

### Embedding

- `desktop-and-cli.partials` The build generates HTML partials for
  piskelapp.com.
- `desktop-and-cli.external-piskel` A host page can load a sprite at
  startup (`window._externalPiskel` + `Events.EXTERNAL_PISKEL_READY`).
- `desktop-and-cli.ready-callbacks` A host page can run code once the
  editor is ready (`window.piskelReadyCallbacks`).
- `desktop-and-cli.release` `npm run release` and
  `npm run release-piskel-web` copy the build to the sibling website
  repositories (`bin/`).

## UI and shortcuts

Desktop-only shortcuts: `ctrl+O`, `ctrl+shift+S`.

## Settings

None.

## Known issues

- The CLI is broken: `cli/index.js` requires `phantomjs`, which is not a
  dependency in `package.json`, so it fails with
  `Cannot find module 'phantomjs'`.
