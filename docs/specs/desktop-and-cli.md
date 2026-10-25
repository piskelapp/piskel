# Desktop app, CLI and embedding

## Purpose

Run Piskel outside the browser (desktop app), from scripts (CLI), and
inside piskelapp.com (embedding).

## Behavior

### Desktop app (NW.js)

- The same `dest/prod` build packaged with NW.js for Windows, Linux
  (32 and 64-bit) and macOS.
- Desktop-only behavior, detected at runtime:
  - save to and open from the filesystem (see
    [save-and-storage.md](save-and-storage.md));
  - a native menu bar on macOS;
  - an unsaved-changes confirmation when closing the window.
- Built with `npm run build:desktop` (Windows + Linux) or
  `npm run build:mac`, output in `dest/desktop/`. `npm run start:nw` runs
  the app locally. The window settings come from the `window` field in
  `package.json`.

### CLI (`piskel-cli`)

- Exports a `.piskel` file to a PNG spritesheet from the command line, with
  options for scale, target width/height, rows/columns, a single frame,
  cropping, a data-URI output and the destination. Usage is documented in
  `cli/README.md`.

### Embedding

- The build generates HTML partials for piskelapp.com.
- A host page can load a sprite at startup (`window._externalPiskel` +
  `Events.EXTERNAL_PISKEL_READY`) and run code once the editor is ready
  (`window.piskelReadyCallbacks`). See
  [architecture.md](../architecture.md#embedding).
- `npm run release` and `npm run release-piskel-web` copy the build to the
  sibling website repositories (`bin/`).

## UI and shortcuts

Desktop-only shortcuts: `ctrl+O`, `ctrl+shift+S`.

## Settings

None.

## Test gaps

Everything above.

## Known issues

- The CLI requires `phantomjs` (`cli/index.js`), which is not a dependency
  in `package.json`. The CLI is probably broken _(to confirm)_.
