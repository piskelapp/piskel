# Architecture

How Piskel is put together, at the level of concepts and responsibilities.

> **The codebase is being modernized** (ES modules, classes, TypeScript; see
> [plans/modernization.md](plans/modernization.md)). This document
> describes concepts that should survive the migration. It deliberately
> does not describe the current module system or build, which are being
> replaced. Code pointers name directories and modules, not files, and
> are descriptive, not prescriptive: the code is the source of truth.

## Overview

Piskel is a single-page app with no framework and no backend. Everything
runs in the browser: drawing, rendering, history, storage (IndexedDB /
localStorage) and export encoding (GIF, PNG, ZIP). The same build runs on
piskelapp.com, from a static file server, and inside NW.js for the desktop
apps.

```
      app bootstrap: constructs and wires every service and controller
                                   │
     ┌──────────────────┬──────────┴─────────┬───────────────────┐
     ▼                  ▼                    ▼                   ▼
  model              controllers          services            rendering
  Piskel▸Layer▸Frame UI panels, dialogs,  history, storage,   canvas renderers,
                     settings drawers     shortcuts, palettes animation loop
     ▲                  │                    │
     └── PiskelController / PublicPiskelController ◀── tools (pen, select, ...)
                        │
                 pubsub events
```

Code layout under `src/js/`: model, controller, service, tools, rendering,
selection, database, utils, widgets, worker, devtools, and `src/js/lib/`
(vendored third-party code: jQuery, jQuery UI,
pubsub, spectrum, gif.js, jszip, ...; not linted, not edited).

## Public contracts

These are relied on by users' data, by piskelapp.com, or by the test suite.
**A refactor must preserve them**, or change them deliberately and
explicitly.

- **`.piskel` files**: every file saved by any version must keep loading
  (see [Persistence](#persistence)).
- **Browser storage**: user data saved by the current version must still be
  found after an upgrade:
  - IndexedDB databases `PiskelDatabase` (browser saves) and
    `PiskelSessionsDatabase` (backups);
  - localStorage: user settings (one entry per setting key), custom
    shortcuts, palettes (`piskel.palettes`), legacy saves (`piskel.*`).
- **Embedding hooks**, used by piskelapp.com:
  - `window._externalPiskel` + the `EXTERNAL_PISKEL_READY` event preload a
    sprite;
  - `window.piskelReadyCallbacks` run after startup.
- **Test hooks**:
  - `data-test-id` attributes in templates;
  - the `window.pskl` entry points used by `tests/e2e/playwright/testutils.ts`;
  - the devtools URL flags (`?test-run=`, `?test=true`, `?test-suite=`)
    used by the recorded drawing tests.

## Application bootstrap

The `pskl.app` object (`src/js/app.js`) constructs and initializes every
service and controller in dependency order, and keeps a reference to each
(e.g. `pskl.app.piskelController`, `pskl.app.historyService`). Today this
doubles as a service locator: many modules reach their collaborators
through `pskl.app.*` rather than receiving them. It also starts the render
loop, a `requestAnimationFrame` loop that renders the drawing area, the
preview and the frames list.

## Document model

`src/js/model/`:

- **`Piskel`**: the document. Width, height, FPS, a `Descriptor` (name,
  description), an ordered list of layers, and `hiddenFrames` (indexes of
  frames skipped by the animated preview; exports still include them).
- **`Layer`**: a name, an opacity, and a list of frames. All layers in a
  piskel have the same number of frames; frame *i* of every layer composes
  animation frame *i*.
- **`Frame`**: a `Uint32Array` of pixels (one 32-bit color per pixel) with
  a `version` counter bumped on every change. `getHash()` (id + version) is
  how renderers and caches detect changes cheaply.
- **`Palette`**: a named list of colors.

`Frame`, `Layer` and `Piskel` reference each other.

## Controllers: Piskel vs PublicPiskel

All edits to the document go through a controller, never directly on the
model:

- **`PiskelController`** holds the current piskel and the current frame and
  layer indexes, and implements every structural operation (add, remove,
  move and duplicate frames and layers, merge, opacity, frame visibility).
- **`PublicPiskelController`** wraps it, and is what the rest of the app
  uses. Its mutating methods are decorated so that each call also records
  the change in history and/or triggers a redraw.

Calling the wrapped controller directly skips history and redraws. Only
the history service does this, to avoid re-triggering events while
replaying.

## History (undo/redo)

`HistoryService` keeps a queue of states, one per `PISKEL_SAVE_STATE`
event:

- **Replay states** store how to redo an action: who performed it (a tool
  or a controller) and the data it needs. Undo loads the closest previous
  snapshot and replays every action after it.
- **Snapshot states** store the whole piskel, serialized compactly. They are
  taken periodically, and whenever an action requests one (e.g. loading a
  sprite), so replays stay short.
- The queue is capped; the oldest states are dropped first.

Invariant: **every action that modifies the document must be replayable.**
Tools raise a save-state event with their replay data and implement
`replay`; structural changes get this by going through
`PublicPiskelController`.

## Events (pubsub)

Components communicate through a global publish/subscribe bus
(`$.publish` / `$.subscribe`, jQuery Tiny Pub/Sub). Event names are
constants in the `Events` registry (`src/js/Events.js`).

Key events: `PISKEL_RESET` (document replaced or structurally changed,
redraw everything), `PISKEL_SAVE_STATE` (record history),
`TOOL_SELECTED`, `PRIMARY_COLOR_SELECTED` / `SECONDARY_COLOR_SELECTED`,
`USER_SETTINGS_CHANGED`, `DIALOG_SHOW` / `DIALOG_HIDE`,
`SHOW_NOTIFICATION`.

## Tools

`src/js/tools/`:

- **Drawing tools** (`src/js/tools/drawing/`) share the `BaseTool` interface. The
  drawing controller calls them on press, move and release with pixel
  coordinates, the current frame, and an **overlay frame**. The overlay
  holds previews (e.g. a rectangle outline while dragging, the hover
  highlight) and is not part of the document. Modifier keys come from the
  mouse event; each tool describes its modifiers for its tooltip.
- **Selection tools** (`src/js/tools/drawing/selection/`) work with the
  `SelectionManager` (`src/js/selection/`), which owns cut, copy, paste,
  delete, commit and system clipboard integration.
- **Transform tools** (`src/js/tools/transform/`) apply to the current frame, or to
  all frames/layers with modifiers.
- The list and order of tools is defined by `ToolController` and
  `TransformationsController`.

## Rendering

`src/js/rendering/`. The drawing area (`DrawingController`) stacks several
canvases:

- the current frame, re-rendered only when its hash changes;
- the other layers above and below, at reduced opacity when layer preview
  is on;
- onion skin (previous and next frames);
- the overlay frame (tool previews and highlight).

`FrameRenderer` handles zoom, offset (panning), the pixel grid, tile
(seamless) mode, and conversion between screen and sprite coordinates. The
animated preview, minimap and frame tiles have their own renderers.

## UI structure

- `src/index.html` is a layout skeleton that includes the HTML templates
  from `src/templates/`. Many templates are filled at runtime with
  `{{placeholder}}` substitution.
- **Settings drawers** (preferences, resize, save, export, import) are
  managed by `SettingsController`, which maps each drawer id to a template
  and a controller.
- **Dialogs** (cheatsheet, import wizard, palette editor, backups, browse
  local saves, performance info) are managed by `DialogsController` and
  opened by publishing `DIALOG_SHOW` with a dialog id. Multi-step dialogs
  use the `Wizard` widget.
- Reusable widgets (color picker, size picker, tabs, synchronized inputs,
  anchor picker, ...) live in `src/js/widgets/`.

## Keyboard shortcuts

The `Shortcuts` registry (`src/js/service/keyboard/`) declares every
shortcut: id, description and default keys, grouped by category.
Components register handlers with the `ShortcutService`. Users can remap
shortcuts from the cheatsheet; overrides are persisted as user settings.

## User settings

`UserSettings` is a key/value store over localStorage, with a default for
each key. Changing a setting publishes `USER_SETTINGS_CHANGED`; components
that depend on a setting subscribe to it.

## Persistence

- **Serialization** (`src/js/utils/serialization/`): the `.piskel` format is
  JSON with a `modelVersion` and per-layer PNG spritesheets encoded as
  base64 data URLs (split into chunks for large layers). The deserializer
  dispatches to readers for older model versions. A separate binary
  serializer is used internally for history snapshots.
- **Storage services** (`src/js/service/storage/`): `StorageService` is the
  entry point and delegates to IndexedDB (browser saves), file download
  (`.piskel` file), or the NW.js filesystem (desktop). Saves from older
  versions in localStorage are migrated to IndexedDB.
- **Backups** (`BackupService`, `src/js/database/`): a periodic snapshot of
  the current piskel per browser session, in a separate IndexedDB database.
- **Unsaved changes**: `SavedStatusService` compares the current history
  state with the last saved one; `BeforeUnloadService` warns on exit.

## Web Workers

`src/js/worker/` has three workers: frame color extraction (used for the
current colors palette), image processing (used to import a palette from
an image), and hashing (not referenced elsewhere; likely dead code).

## Environments

`Environment` (`src/js/utils/`) detects where the app runs:

- **NW.js desktop**: enables filesystem save/open, a native menu on macOS,
  and window-close handling.
- **Integration test** (URL contains `integration-test`): suppresses the
  unsupported-browser warning.
- **Devtools** (`src/js/devtools/`): URL flags enable recording and
  replaying drawing sessions; see [testing.md](testing.md).
