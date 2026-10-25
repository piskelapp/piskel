# Vision

> Status: draft. Statements marked _(to confirm)_ are inferred from the code
> and project history rather than stated by the maintainers.

## What Piskel is

Piskel is a free, open-source editor for pixel art and sprite animations. It
runs in the browser with no account or install required, and is the editor
behind [piskelapp.com](https://www.piskelapp.com). The same build is also
packaged as a desktop application (NW.js) for Windows, macOS and Linux.

## Who it is for

- Hobbyists, students and game developers who need small animated sprites
  quickly, without learning a full image editor.
- People who want to go from an idea to a GIF or a spritesheet in a few
  minutes.

## Goals

- **Easy to pick up.** A first-time user can draw, animate and export
  without reading documentation. Tools are discoverable from the toolbar,
  tooltips and the shortcuts cheatsheet (`?`).
- **Animation first.** Frames, a live animated preview and onion skinning
  are always visible, not hidden behind a mode.
- **Exports that work in real projects.** Animated GIF, PNG spritesheets
  (with layout options and JSON metadata), per-frame ZIP, C arrays, and the
  native `.piskel` format.
- **Your work is not lost.** Automatic backups of recent sessions,
  browser-local saves, and an "unsaved changes" warning on exit.
- **Runs anywhere a modern desktop browser runs**, and offline as a desktop
  app.

## Non-goals

- **Mobile and touch devices.** Not supported.
- **Being a general-purpose image editor.** Large canvases (the maximum is
  1024×1024), photo editing, filters and vector tools are out of scope.
- **Cloud features in this repository.** Accounts, galleries and online
  storage belong to piskelapp.com, not to the editor. The editor only
  exposes integration points (e.g. loading an external piskel at startup).
- **Supporting legacy browsers.** Only the latest Chrome, Firefox and Edge
  are targeted; IE-era code is being removed.

## Product principles

- **Stability over features.** Piskel has a large existing user base and
  file format. Changes that alter the user experience need an explicit
  maintainer decision; see [CONTRIBUTING.md](../CONTRIBUTING.md).
- **Backward compatibility of `.piskel` files.** Every file ever saved must
  keep loading. The deserializer keeps readers for older model versions
  (`src/js/utils/serialization/backward/`).
- **Everything is undoable.** Any change to the document goes through the
  history service (see [architecture.md](architecture.md#history-undoredo)).
- **Keyboard friendly.** Every tool and most actions have a shortcut, and
  shortcuts can be remapped by the user.

## Current focus

The immediate goal is a large, mostly agent-driven refactor that
modernizes the whole codebase (ES modules, classes, TypeScript), tracked in
[plans/modernization.md](plans/modernization.md). The refactor must not
change behavior. What supports it:

1. These docs: feature specs describe the behavior to preserve, and the
   e2e suite verifies it.
2. Hardening the Playwright e2e suite and closing the test gaps listed in
   the specs, so it can be trusted as a safety net.
3. Removing dead code and legacy browser workarounds first, so less code
   needs migrating.

New user-facing features are not a priority during this phase.
