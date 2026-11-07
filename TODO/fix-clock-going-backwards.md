# Fix input being ignored when the system clock goes backwards

**Status:** not started. Found while investigating flaky e2e tests on
PR #1313, which did not introduce it.

## The bug

The app uses wall-clock time (`Date.now()`, `new Date().getTime()`) to measure
short intervals. When the system clock moves back, `now - last` goes negative,
so the "has enough time passed?" check fails until the clock catches up. For a
jump of 2.5 seconds, input is silently ignored for about 2.5 seconds.

What users see:

- **Strokes are cut short.** Mouse moves are dropped, so part of the drawing is
  missing. This is the serious one.
- **Undo and redo do nothing**, with no message. History itself is intact.
- **Panning with the middle button picks a color instead.** The moves are
  dropped, so the view doesn't move, and the release counts as a middle click,
  which sets the primary color to the pixel under the cursor. This is what makes
  the `undo-redo.not-recorded` e2e test flaky.

Who can hit it: anyone whose clock moves back, such as WSL2 or VMs that correct
their clock, NTP corrections, or a manual time change. Setting the clock back by
an hour would block drawing strokes and undo for about an hour. How common this
is outside WSL2 is unknown. Daylight saving changes don't trigger it, because
these values ignore time zones.

## Where to fix it

Use `performance.now()`, which never goes backwards, for interval checks:

| Code | Check | Effect of a jump | Priority |
| --- | --- | --- | --- |
| `DrawingController.onMousemove_` | `MOUSEMOVE_THROTTLING` (10ms), uses `new Date().getTime()` | Mouse moves dropped | High |
| `HistoryService.isLoadStateAllowed_` and `loadState` | `LOAD_STATE_INTERVAL` (50ms), `lastLoadState` | Undo and redo ignored | High |
| `PreviewController.shouldRender_` and `render` | `RENDER_MINIMUM_DELAY` (300ms), `lastRenderTime` | Forced preview refresh delayed | Low |
| `FunctionUtils.throttle` | Interval passed by the caller, used by `CurrentColorsService` | Update delayed, not lost | Low |

`previousMousemoveTime` starts at 0 and `lastLoadState` at -1. `performance.now()`
starts near 0 when the page loads, so check the first mouse move and first undo
still work.

**Leave these on `Date.now()`:** they are real timestamps, not intervals.

- `BackupService`
- `IndexedDbStorageService` and `LocalStorageService`
- `BaseSelection.time`, which is compared across tabs, and `performance.now()`
  isn't comparable between pages

`DrawingLoop.loop_` already handles this with `Math.max(0, ...)`, from commit
`a6d2a5b` ("Fix preview freezing when the system clock goes backwards"). It keeps
using `Date.now()`, which is fine because it only needs to avoid a negative delta.
Switching the code above to `performance.now()` is simpler than repeating that
clamp, because those checks would otherwise have to handle a negative result too.

## Evidence

All on WSL2. A script comparing wall-clock and monotonic time measured the clock
jumping back about 2.48 seconds every 32 seconds or so.

Full e2e suite without retries:

| Code | Runs | Failures per run |
| --- | --- | --- |
| `master`, 341 tests, 8 workers | 2 | 0, 1 |
| PR #1313, 398 tests, 8 workers | 2 | 2, 4 |
| PR #1313, 398 tests, 4 workers | 3 | 3, 1, 3 |
| PR #1313, only `Date.now()` protected | 2 | 1, 1 |
| PR #1313, `Date.now()` and `new Date()` protected | 3 | 0, 0, 0 |

There were 11 clock jumps during the last three runs. Failures were mostly
drawing replay tests ending in `KO`, a different set each run, which fits a jump
hitting whichever tests are running at that moment. Fewer workers didn't help,
which rules out load. CI on Ubuntu and macOS passed. Only 2 runs on `master`, so
its lower failure count may just be chance.

Moving the clock back 2.5 seconds at pixel 8 of a stroke across 20 pixels:

```text
no jump:   XXXXXXXXXXXXXXXXXXX.
jump:      XXXXXXXX............
```

## How to reproduce

**Check your machine's clock:** run this alongside the tests. It prints a line for
each jump.

```python
import time
wall, mono = time.time(), time.monotonic()
while True:
    time.sleep(0.02)
    w, m = time.time(), time.monotonic()
    drift = (w - wall) - (m - mono)
    if abs(drift) > 0.02:
        print(f"jump {drift * 1000:+.0f}ms", flush=True)
    wall, mono = w, m
```

**Move the clock from a test:** this replaces `Date` before the app loads, then
`window.__jump(-2500)` moves the clock back. It works on any machine.

```ts
await page.addInitScript(() => {
  const RealDate = Date;
  let offset = 0;
  (window as any).__jump = (ms: number) => { offset += ms; };
  class ShiftedDate extends RealDate {
    constructor(...args: any[]) {
      if (args.length) {
        super(...(args as [any]));
      } else {
        super(RealDate.now() + offset);
      }
    }
    static now() { return RealDate.now() + offset; }
  }
  (window as any).Date = ShiftedDate;
});
```

## Plan

1. Write the tests below and confirm they fail on the current code.
2. Switch the code in "Where to fix it" to `performance.now()`.
3. Run the full suite without retries a few times on WSL2, with the clock script
   running, and confirm there are no failures:
   `npx playwright test --retries=0 --reporter=line`

## Tests to add

Follow `.claude/skills/e2e-tests/SKILL.md`. Each needs a spec claim, so add for
example `canvas.clock-backwards` and `undo-redo.clock-backwards` to the specs.

- Move the clock back in the middle of a stroke: the stroke has no gap.
- Move the clock back between two undo presses: the second undo still applies.
- Move the clock back before a middle-button pan: the view moves, and the
  primary color doesn't change.

`page.clock` may not suit these: it also fakes `performance.now()`, and after the
fix the app would measure time with it, so check how it behaves. The script above
only replaces `Date`, which is what a real jump affects.

## Cleanup after the fix

- Remove the retry and the `TODO` from the `undo-redo.cap` test in
  `tests/e2e/playwright/integration/undo-redo/test-undo-redo.spec.ts`.
- Remove the clock entry from "Undo and redo" in `docs/known-issues.md`.
- Delete this file.
