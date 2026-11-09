# TypeScript and ESM migration

Status: spec finalized, migration not started.

When the migration is done, this file is removed or turned into archived
documentation.

## Goal

Convert Piskel's application code and unit tests from JavaScript to
TypeScript, and from `$.namespace` globals to ESM modules, without changing
what users see.

## Scope

In scope:

- All application code in `src/js`, except vendored code in `src/js/lib`
  (194 files, about 20,000 lines).
- The unit tests in `tests/unit-tests` (32 files).
- The CSS build.
- Build and test configuration, where the new setup requires it.

Out of scope:

- User-visible behavior changes. If a change would alter a claim in
  `docs/specs`, it is a bug in the migration.
- Node tooling stays JavaScript: `vite.config.js`, `vite-plugins/`, `scripts/`
  and `bin/`. It changes only where the build requires it. Code made obsolete
  by the new build, such as the concat plugin's app-code path, is removed.
- Upgrading or replacing vendored libraries.
- `tests/e2e` is not modified.

`cli/` is removed. It relies on PhantomJS, which is not in `package.json`,
and on `pskl.*` globals that won't exist anymore. Its `piskel-cli` entry in
`package.json` goes too, and the `minimist` dependency, which only it uses.

## Approach

The migration happens all at once, on one branch. Files don't have to work
between intermediate commits, but the branch must pass every check in
[Acceptance criteria](#acceptance-criteria) before it is merged. Renames from
`.js` to `.ts` happen together with the content changes.

The April 2026 attempt in `git stash` used a per-file `window.pskl` shim and
was left with failing tests. Don't apply it. This spec replaces that design.

## TypeScript rules

- `tsconfig.json` has `strict: true`, `target: "ES2020"`,
  `useDefineForClassFields: false` and `isolatedDeclarations: true`. It includes
  only `src` and `tests/unit-tests`.
- Never use `any`, explicit or implicit.
- Never use `ReturnType`, or the other utilities that derive a type from a
  signature: `Parameters`, `ConstructorParameters` and `InstanceType`.
- Exported functions and public class methods declare their return type.
  `isolatedDeclarations` enforces this. Local helpers may rely on inference.
- Use `type` instead of `interface`. The only exception is the `declare global`
  augmentation of `Window`, which TypeScript can only express as an interface.
- Never use `@ts-ignore`, `@ts-nocheck`, `@ts-expect-error` or `as unknown as`.
- A single `as` is allowed only to narrow DOM and event types, as in
  `evt.target as HTMLInputElement`. Elsewhere, fix the types. Reviewers check
  this, since tooling can't tell the cases apart.
- Never use the non-null assertion (`!`), including `field!: T` declarations.
  Handle `null` and `undefined` explicitly, without changing runtime behavior.
- A field set outside the constructor, such as in `init()`, is typed
  `T | undefined`. This includes the fields of the `app` holder.
- Where such a value must be set, use
  `assertDefined<T>(value: T | null | undefined, name: string): T` from
  `src/js/utils/core.ts`. It throws an error naming the value, so a missing
  value still fails, as it does today. Where the code already handles the
  missing case, keep that check.
- For an element that must exist, use `Dom.getElement<T extends Element>(selector, parent = document)`
  in `src/js/utils/Dom.ts`. It wraps `querySelector<T>` and throws an error
  naming the selector when nothing matches, so a missing element still fails,
  as it does today when the code dereferences `null`.
- Where the code already handles a missing element, keep that check and call
  `querySelector` directly. Don't replace it with `Dom.getElement`, which would
  turn a handled case into an error.
- `tests/e2e` is exempt from these rules, since it isn't modified. It declares
  its own `pskl: any` on `Window`, so it stays out of `tsconfig.json`.
- The root `global.d.ts` is deleted: it declares `pskl: any`.

Enforcement in CI and in the pre-commit hook:

- `tsc --noEmit`.
- Biome: `noExplicitAny`, `noNonNullAssertion`, `noTsIgnore`,
  `noRestrictedTypes` (for the banned utility types),
  `useConsistentTypeDefinitions` (set to `type`), `noDefaultExport` and
  `noImportCycles`.
- A check for the forbidden patterns Biome doesn't cover: `@ts-nocheck`,
  `@ts-expect-error`, `as unknown as` and `field!:` declarations.
- Biome also covers `tests/unit-tests`. Today it only runs on `src/`.

Biome's `javascript.globals` list shrinks to what is still really global.

### Pub/sub events

There are 183 `$.subscribe` and `$.publish` calls. A single type maps each
`Events` constant to its argument tuple, and the `.d.ts` for `pubsub.js` makes
both functions generic over that map. The calls keep their current form.

## ESM rules

- Get rid of `src/piskel-script-list.js`.
- Get rid of `$.namespace`; use ESM `export` and `import` instead. Delete
  `jQuery.namespace` from `core.js`.
- No default exports, only named exports.
- Remove IIFEs unless they are needed.
- No import cycles.
- `src/js/main.ts` is the single entry point.
- Files keep their current location and name, with a `.ts` extension, so the
  migration can be reviewed file by file.
- Class names and other exported names stay the same as today's namespace
  members, as far as possible. For example, `pskl.model.Frame` becomes the
  `Frame` class in `src/js/model/Frame.ts`.

Exports whose name would shadow a global get a new name:

| Today | Export |
| --- | --- |
| `pskl.utils.Math` | `MathUtils` |
| `pskl.utils.Array` | `ArrayUtils` |
| `pskl.utils.Event` | `EventUtils` |

### Import cycles

53 files reference `pskl.app`, and `app.js` creates all the controllers and
services. Direct imports would produce a 48-file cycle.

- `app.ts` only declares a typed holder object. Its only imports are
  `import type`.
- `main.ts` fills the holder during init.
- Two other cycles exist and need fixing individually:
  `CanvasRenderer` with `FrameUtils`, and `Shortcut` with `UserSettings`.

### Code changes

- Constructor functions and prototype assignments become `class` (1053
  assignments, 62 `inherit` calls). TypeScript can't type the old pattern.
- `superclass` calls (43) become `super`. `super()` must run before `this` is
  touched, so check constructors that did work before calling the parent.
- Modern syntax is allowed where safe: `const`/`let`, arrow functions and
  template literals.
- Don't change logic, rename things (except the table above) or restructure
  code.

Things that can silently change behavior:

- ESM is strict mode, and the code wasn't: `this` is `undefined` in unbound
  plain functions, and writing to an undeclared variable throws.
- Arrow functions capture `this`. Don't convert functions that rely on a
  dynamic `this`, such as callbacks invoked with `scope`.
- `let` in a loop creates a new binding per iteration, and `var` hoists. Check
  closures and use-before-assignment when converting.
- Class declarations aren't hoisted. Module-level code can no longer use a
  class before its declaration.
- Class methods aren't enumerable, so `for...in` no longer finds them.
  `utils.wrap` relies on this to give `PublicPiskelController` the whole
  `PiskelController` API, and would silently copy nothing. Replace it with
  explicit, typed delegating methods. Also check the `for (var key in this)`
  loop in `AbstractSettingController`.
- Bundlers treat a bare `require` as a module import. The two `require("nw.gui")`
  calls, in `app.js` and `BeforeUnloadService.js`, become `window.require`,
  which is typed in a `.d.ts`.
- Fields that e2e tests read or write must stay real, public runtime
  properties: don't use `#private` for them. For example, tests read
  `renderer.zoom`, `renderer.margin`, `renderer.offset` and
  `onionSkinRenderer.renderer`, and they write
  `HistoryService.MAX_SAVED_STATES` and `HistoryService.SNAPSHOT_PERIOD`,
  which must be mutable and read on each use.

### Workers

The hash, framecolors and imageprocessor workers are built today by calling
`toString()` on a function, which breaks as soon as the function depends on
imported or transpiled helpers.

- Each worker becomes a TypeScript module loaded with Vite's `?worker&inline`.
- Messages between the page and the workers are typed.
- `WorkerUtils` is removed.

### Vendored libraries

`src/js/lib` stays unchanged and is not converted, with one exception below.
`gif.js` needs top-level `this === window`, so these files can't be ES modules.

The exception is line 674 of `spectrum.js`, a local Piskel patch that reads
`pskl.UserSettings`, which is no longer global. It gets the color format from
a function that Piskel passes as an option instead, so the format is still read
each time it is needed.

- A short vendor list replaces the library entries of the script list.
- Vendored files run as classic code before the app code. They are currently
  interleaved with app files in the script list, so check that moving them
  first doesn't matter.
- Files in `src/js/lib` are typed with `.d.ts` files only, never by converting
  the library. Each `.d.ts` sits next to the file it describes, for
  example `src/js/lib/gif/gif.d.ts`, and covers the parts Piskel uses.
- The TypeScript rules apply to these `.d.ts` files, so they can't use `any`.
  Biome currently ignores `src/js/lib/**`, so its override must exclude
  `*.d.ts`, and `tsconfig.json` must keep `skipLibCheck: false`.

## Build output

The source is ESM, but production still emits a single classic file:

- One IIFE bundle containing vendor and app code, with no code splitting.
- The build target is ES2020 (`build.target`).
- No extra emitted files: inlined workers stay inside the bundle, and CSS
  assets keep their current paths, with no content hashes.

`dest/prod` must keep exactly today's layout, because `bin/copy-to-piskel-web.js`
copies it into the parent website:

```text
index.html
logo.png
js/piskel-packaged-{version}.js
js/piskel-packaged-{version}.js.map
js/piskel-packaged-min-{version}.js
js/piskel-packaged-min-{version}.js.map
css/piskel-style-packaged-{version}.css
css/fonts/**
img/**
piskelapp-partials/main-partial.html
piskelapp-partials/piskel-web-partial.html
piskelapp-partials/piskel-web-partial-kids.html
```

- `{version}` keeps today's build-date pattern, `yyyy-mm-dd-hh-MM`.
- All of these use one `{version}`, computed once per build, so a build
  running across a minute boundary can't produce mismatched names.
- The unminified bundle and both source maps are still emitted. `index.html`
  loads the minified bundle.
- Paths in `index.html` and the partials stay relative.
- Apart from the `{version}` value, the only intended difference in
  `index.html` and the partials is the compiled form of the inline boot script
  described in [Boot](#boot).
- The desktop build keeps working as it does today.

### Boot

`src/piskel-boot.js` becomes `src/piskel-boot.ts`, with the same logic. It is
still inlined into `index.html` and the partials, where it loads the stylesheet
and the bundle as it does today.

- The build compiles it to plain JavaScript before inlining it, so
  `vite-plugins/html-include.js` has to strip the types. `@@version` and
  `@@releaseVersion` are replaced after that, as today.
- The TypeScript rules apply, including the ban on `!`. For example, the
  loading mask lookup needs an explicit check, and `style.opacity` takes a
  string.
- It runs as an inline classic script, so it can't use `import` or `export`,
  and it can't use `Dom.getElement`. Its IIFE stays, so that its variables
  don't leak into the global scope.
- `main.ts` doesn't call `app.init()`. The boot script still does, through the
  bridge, from `window._onPiskelReady`.

`scripts/serve.js` remains the dev server, rebuilding on change.

## CSS

- `src/css/main.css` has one `@import` per file, in the exact order of today's
  `piskel-style-list.js`.
- `main.ts` imports `main.css`, and nothing else imports CSS. Importing CSS
  from individual modules would make the order depend on the module graph.
- Delete `src/piskel-style-list.js`.
- No CSS minification and no asset inlining (`assetsInlineLimit: 0`).
- Keep the `var(--highlight-color)` replacement with `gold`.
- `icons.css` is generated by `build:sprites`, so the sprites step still runs
  first.

**Order check:** build the CSS bundle before and after the migration and
compare them. They must be byte-identical after normalizing only `url()` paths
and the whitespace between source files. Any other difference must be
understood and fixed. Bootstrap and Spectrum contain legacy CSS hacks, which
must come through unchanged.

## Temporary window bridge

One small module exposes the globals used by `piskel-boot.ts` and the e2e
tests, as live references to the real objects:

- `pskl.app`, including `piskelController`, `drawingController` and
  `backupService`, and `init` for the boot script
- `pskl._releaseVersion`, written by the boot script
- `pskl.utils.colorToInt`
- `pskl.utils.FrameUtils`
- `pskl.model.Frame`, `pskl.model.Layer` and `pskl.model.Piskel`
- `pskl.service.HistoryService`

Nothing in `src` may read the bridge except `piskel-boot.ts`. Nothing else
stays on `window.pskl`.

`window._onPiskelReady` and `window.piskelReadyCallbacks` also stay: the boot
script defines them, and embedders can use the callbacks.

Removing the bridge is follow-up work, once e2e tests stop using `window.pskl`.

## Unit tests

- Convert the tests to TypeScript and ESM imports. The TypeScript and ESM rules
  apply to them.
- Move from Karma/Jasmine to Vitest browser mode, using Playwright as the
  provider. Check that it is compatible with Vite 8.
- Remove `karma.conf.js`, the Karma dependencies, and Puppeteer if nothing else
  needs it. Update `npm run unit-tests` and `run-test-ci.sh`.
- Tests keep their assertions. Coverage must not shrink.
- Tests that replace members, such as `pskl.UserSettings = {...}` or
  `pskl.app.shortcutService = {...}`, can't work on ESM bindings. Replace them
  with spies on the exported object, or by setting fields on the app holder.

## Acceptance criteria

Automated, all in CI:

- `tsc --noEmit` passes.
- Biome and the forbidden-patterns check pass.
- `npm run spec-check` passes.
- All e2e tests, visual and non-visual, pass with `tests/e2e` unmodified. They
  run against the minified production bundle.
- All unit tests pass.
- `src/js` contains no `.js` files outside `src/js/lib`, and `$.namespace`
  appears nowhere.

One-time, before merging, with a temporary script that builds the merge-base
commit and compares it with the branch. The script is deleted with the
migration:

- The CSS order check passes.
- The build output check passes: with `{version}` normalized, the list of files
  in `dest/prod` is identical before and after the migration, and `index.html`
  and the partials differ only by the compiled boot script.

Manual:

- NW.js desktop build smoke test: open and save a file. These paths use
  `window.require("fs")` and aren't covered by e2e.

Reported, not blocking:

- At the very end, a before/after report of bundle sizes.

## Updates when done

- Remove or archive this file.
- Update the README and any docs that mention the old build or test commands.
- Update `.claude/skills/e2e-tests` if anything there refers to the old setup.
