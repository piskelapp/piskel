# Post-migration todos

Review comments on [#1318](https://github.com/piskelapp/piskel/pull/1318)
(TypeScript and ESM migration) that were agreed but postponed to later PRs.

## Dependencies

- **Remove jQuery.**
  [thread](https://github.com/piskelapp/piskel/pull/1318#discussion_r4575280216)
- **Remove jQuery UI.** It is only used for drag and drop, and weighs about
  500 KB.
  [thread](https://github.com/piskelapp/piskel/pull/1318#discussion_r4575275445)
- **Remove Bootstrap.** It seems to be used only for tooltips.
  [thread](https://github.com/piskelapp/piskel/pull/1318#discussion_r4575283480)
- **Replace the pubsub library** with a TypeScript implementation.
  [thread](https://github.com/piskelapp/piskel/pull/1318#discussion_r4575278806)
- **Replace Spectrum** when a palette or color feature comes up. It is user
  facing, so it needs tests around color selection first.
  [thread](https://github.com/piskelapp/piskel/pull/1318#discussion_r4575292947)

## UI

- **Lifecycle.** Classes that register side effects (global or DOM listeners)
  implement a `Disposable` interface, with a `registerDisposable` pattern so
  that disposal cascades. No React.
  [thread](https://github.com/piskelapp/piskel/pull/1318#discussion_r4575217621)
- **Templating.** Replace the custom templates and `innerHTML` insertions with
  a lightweight templating library, not React or another heavy framework.
  `AnchorWidget` is one candidate.
  [thread](https://github.com/piskelapp/piskel/pull/1318#discussion_r4575245247),
  [AnchorWidget](https://github.com/piskelapp/piskel/pull/1318#discussion_r4575576653)

## Code

- **Private members.** Replace the `_` suffix with `#` (runtime private) and/or
  the `private` keyword. Use both if possible, otherwise `#` if browser support
  is good enough.
  [thread](https://github.com/piskelapp/piskel/pull/1318#discussion_r4575201165)
- **async/await.** Migrate promise chains to async/await.
  [thread](https://github.com/piskelapp/piskel/pull/1318#discussion_r4578036685)
- **`bind`.** Replace `bind` calls with arrow functions assigned as class
  fields.
  [thread](https://github.com/piskelapp/piskel/pull/1318#discussion_r4578018102)
- **Branded ids.** Use branded types instead of `string` for ids, as in
  `Events.ts`.
  [thread](https://github.com/piskelapp/piskel/pull/1318#discussion_r4575564715),
  [thread](https://github.com/piskelapp/piskel/pull/1318#discussion_r4575566188)
- **JSDoc.** Rely on TypeScript signatures for types, and keep only comments
  that add information the signature doesn't give.
  [thread](https://github.com/piskelapp/piskel/pull/1318#discussion_r4578031259)
- **Error handling strategy.** Investigate and decide how errors are handled
  across the app: `Result` values as in Rust, `throw` with `catch` and
  recovery at well-chosen levels, or another approach. Raised on the
  session deletion in `SelectSession`, which has no error handling.
  [thread](https://github.com/piskelapp/piskel/pull/1318#discussion_r4655126284)
- **Values shared between CSS and TypeScript.** Share them through code,
  probably at build time, instead of a comment that gets out of sync. For
  example, `PREVIEW_SIZE` in `SessionDetails` must match the preview
  dimensions in `dialogs-browse-backups.css`.
  [thread](https://github.com/piskelapp/piskel/pull/1318#discussion_r4577797544)
- **UUIDs.** The fake UUIDs are fine for non-critical ids (palettes, sessions,
  history), not for ids stored in a backend. If that changes, use
  `crypto.randomUUID()`, or UUID v7 for time-ordered ids.
  [thread](https://github.com/piskelapp/piskel/pull/1318#discussion_r4575636632)

## Unanswered

- **`assertInitialized` usage.** It is called about 700 times. Are all those
  spots code smells that should be fixed?
  [thread](https://github.com/piskelapp/piskel/pull/1318#discussion_r4577817456)
