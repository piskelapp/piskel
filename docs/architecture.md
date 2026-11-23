# Architecture and code rules

The rules for Piskel's application code, in `src/js`, and its unit tests, in
`tests/unit-tests`. Most are enforced by tooling, listed in
[Enforcement](#enforcement). Reviewers check the others.

How each feature behaves is described in the [feature specs](specs/README.md).

## Overview

- The application code is TypeScript, organized as ES modules.
- `src/js/main.ts` is the single entry point. It creates the controllers and
  services and fills the `app` holder.
- Production ships one classic IIFE bundle, loaded by an inline boot script.
- Vendored libraries in `src/js/lib` and Node tooling (`vite.config.js`,
  `vite-plugins/`, `scripts/`, `bin/`) stay JavaScript.

## TypeScript

`tsconfig.json` is `strict`, with `isolatedDeclarations` and
`useDefineForClassFields: false`. It keeps `skipLibCheck: false` so that the
`.d.ts` files of `src/js/lib` are checked too.

- Never use `any`, explicit or implicit. Type the value, or use `unknown` and
  narrow it.
- Never use `ReturnType`, `Parameters`, `ConstructorParameters` or
  `InstanceType`. Declare the type, so it can be read without following the
  signature it is derived from.
- Exported functions and public methods declare their return type. Local
  helpers may rely on inference.
- Use `type`, not `interface`, except for the `declare global` augmentation of
  `Window`.
- Never use `@ts-ignore`, `@ts-nocheck`, `@ts-expect-error`, `as unknown as`
  or the non-null assertion (`!`), including `field!: T` declarations.
- A single `as` is allowed only to narrow DOM and event types, as in
  `evt.target as HTMLInputElement`. Elsewhere, fix the types.

## Missing values

A value that must exist fails loudly when it doesn't. Pick the helper that
says what went wrong:

- **Lazily initialized fields.** Most classes set their fields in `init()`,
  because the constructor runs before the DOM and the other services are
  ready. Such a field is typed `T | undefined`, and read through
  `assertInitialized(value, name)` from `src/js/utils/core.ts`. Use it for
  nothing else: its message, `Used before it was initialized: <name>`, is
  misleading for other values.
- **Elements that must exist.** `Dom.getElement<T>(selector, parent)` from
  `src/js/utils/Dom.ts` throws an error naming the selector. Where the code
  already handles a missing element, keep calling `querySelector`.
- **Canvas 2d contexts.** `Dom.getContext2d(canvas)`.
- **Anything else,** such as a regexp match: throw an error that says what
  went wrong, such as `Not a color line: …`, or handle `null` where the code
  already does, as when `getPixel` returns `null` outside the frame.

## Modules and imports

- Only named exports. No import cycles. No IIFEs in modules.
- Modules from `src/js` are imported through the `@/` alias, as in
  `import { Frame } from "@/model/Frame"`. Same-folder imports stay relative
  (`./X`); parent-relative imports (`../`) are not allowed. The alias is
  declared once, as `paths` in `tsconfig.json`.
- Unit tests import `tests/unit-tests/testutils` with a relative path.
- Exports don't shadow globals: `MathUtils`, `ArrayUtils` and `EventUtils`,
  not `Math`, `Array` and `Event`.
- Use `window.require`, typed in a `.d.ts`, for NW.js modules such as `nw.gui`
  and `fs`. Bundlers treat a bare `require` as a module import.

### The `app` holder

`src/js/app.ts` only declares the typed `app` holder, with `import type`
imports only, so that controllers and services can reach each other without
import cycles. `main.ts` fills it during init.

## Classes

- A method that every subclass implements is `abstract`. Don't add base-class
  methods that throw "not implemented".
- A method that only some subclasses implement isn't declared on the base
  class. Code that needs it requires it in its type: only recording tools
  implement `replay`, so `raiseSaveStateEvent` declares
  `this: Tool & Replayable`.
- Remove unused parameters, and the matching arguments. Prefix with `_` an
  unused parameter whose position is imposed from outside, such as a callback
  event followed by used arguments, or the parameters of a no-op base-class
  hook that subclasses override.
- Class methods aren't enumerable. Delegate with typed methods, as
  `PublicPiskelController` does, rather than copying members in a loop.
- Fields that e2e tests read or write stay public, not `#private`: for
  example `renderer.zoom` and `renderer.offset`, or
  `HistoryService.MAX_SAVED_STATES`, which must be mutable and read on each
  use.

## Pub/sub events

`EventArgs`, in `src/js/Events.ts`, maps each `Events` constant to its
subscribers' arguments. `src/js/lib/pubsub.d.ts` types `$.subscribe` and
`$.publish` over that map. A new event gets an entry in `EventArgs`.

## Workers

Each worker is a TypeScript module loaded with Vite's `?worker&inline`, as in
`src/js/worker/hash/HashWorker.ts`, with typed messages. Don't build workers
from a function's `toString()`: it breaks once the function uses imported or
transpiled helpers.

## Vendored libraries

- `src/js/lib` stays classic scripts, listed in `src/vendor-list.js` and run
  before the app code. `gif.js`, for one, needs top-level `this === window`.
- Each library is typed by a `.d.ts` next to it, covering only what Piskel
  uses, without `any`.
- Vendored code doesn't read Piskel's state: Piskel passes what it needs as
  options, as with Spectrum's `getDisplayFormat`.

## Build output

Production ships one IIFE bundle with vendor and app code, targeting ES2020,
with no code splitting, no extra emitted files and no content hashes. The
NW.js build uses the same bundle. `dest/prod` keeps this layout, because
`bin/copy-to-piskel-web.js` copies it into the parent website:

```text
index.html
logo.png
js/piskel-packaged-{version}.js(.map)
js/piskel-packaged-min-{version}.js(.map)
css/piskel-style-packaged-{version}.css
css/fonts/**
img/**
piskelapp-partials/main-partial.html
piskelapp-partials/piskel-web-partial.html
piskelapp-partials/piskel-web-partial-kids.html
```

`{version}` is the build date, `yyyy-mm-dd-hh-MM`. `index.html` loads the
minified bundle, and its paths, like those of the partials, are relative.

### Boot

`src/piskel-boot.ts` is inlined, types stripped, into `index.html` and the
partials by `vite-plugins/html-include.js`. It loads the stylesheet and the
bundle, then calls `app.init()` from `window._onPiskelReady`.

It runs as an inline classic script: no `import` or `export`, so no helpers
such as `Dom.getElement`, and its IIFE stays to keep its variables out of the
global scope. The TypeScript rules still apply.

### Window bridge

`src/js/bridge.ts` exposes live references on `window.pskl` for the boot
script and the e2e tests: `app`, `_releaseVersion`, `colorToInt`,
`FrameUtils`, `Frame`, `Layer`, `Piskel` and `HistoryService`. Nothing else in
`src` reads it, and nothing else gets added. It goes away once the e2e tests
stop using it.

## CSS

- `src/css/main.css` has one `@import` per stylesheet, in cascade order.
  `main.ts` imports it, and nothing else imports CSS, so the order doesn't
  depend on the module graph.
- No CSS minification and no asset inlining.
- `icons.css` is generated by `npm run build:sprites`.

## Tests

- Unit tests are TypeScript, run by Vitest in browser mode, and follow the
  rules above. To replace a dependency, spy on the exported object or set a
  field on the `app` holder: ESM bindings can't be reassigned.
- `tests/e2e` is outside `tsconfig.json` and exempt from these rules. It
  reaches the app through the window bridge.

## Enforcement

`npm run lint` runs in CI and in the pre-commit hook, on `src/` and
`tests/unit-tests/`:

- `tsc --noEmit`.
- Biome: `noExplicitAny`, `noNonNullAssertion`, `noTsIgnore`,
  `noRestrictedTypes`, `useConsistentTypeDefinitions`, `noDefaultExport`,
  `noImportCycles`, `noUselessConstructor` and `noUnusedFunctionParameters`.
- `scripts/check-forbidden-patterns.js`: `@ts-nocheck`, `@ts-expect-error`,
  `as unknown as`, `field!:` declarations, `.js` files in `src/js` outside
  `src/js/lib`, `$.namespace`, and parent-relative imports.
