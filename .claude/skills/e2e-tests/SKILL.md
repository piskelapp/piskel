---
name: e2e-tests
description: Rules for writing, improving and reviewing Piskel's Playwright e2e tests (tests/e2e/playwright). Use this whenever adding or changing a *.spec.ts test, covering a claim from docs/specs/untested.txt, fixing a flaky e2e test, or reviewing e2e test code, even if the request only says "add a test" or "cover this spec".
---

# Piskel e2e tests

Follow this for all three kinds of work:

- **Writing:** pick the claims, read the code behind them, write the tests, then run them.
- **Improving:** keep what the test verifies and bring it in line with the rules below.
- **Reviewing:** report where a test breaks a rule or could pass while the behavior is broken. Give the file, the line and a concrete fix.

## Readability

An e2e test should be easy for a human to read. Someone new to the test should quickly see what it sets up, what it does and what it expects, because that's how they tell whether a failure is a bug in the app or in the test. When a shorter or cleverer version would be harder to follow, prefer the clearer one.

Each test should read like very simple instructions about what the user is doing. If a step is a convoluted expression or takes too many lines, first check whether `testutils.ts` already has a helper for it. If not, add one there with a user-friendly, descriptive name, so the test tells a story:

```ts
// Instead of
await waitFor(async () => (await getFrameTiles(page).count()) === 2);
// write
await assertFrameCount(page, 2);
```

When picking names, use user-friendly, semantic names rather than short, cryptic ones, such as `layer1` instead of `l1`, so the reader doesn't have to work out what a name refers to.

Add a comment for each high-level user step, so the test reads as a scenario from top to bottom:

```ts
// Draw in second frame.
await clickTool(page, 'tool-pen');
await drawAtPixel(page, 0, 0);
expect(await readPixelRows(page, 4, 4, 0, 1)).toEqual(ONE_PIXEL);

// Go back to first frame and undo.
await selectFrame(page, 0);
await undo(page);
await waitForGrid(page, 4, 4, EMPTY, { frameIndex: 1 });
```

## Specs

- Tests for `docs/specs/<spec>.md` live in `tests/e2e/playwright/integration/<spec>/`.
- Every e2e test references at least one spec claim, using a tag for each claim it verifies: `{ tag: ['@layers.rename'] }`. `spec-check` doesn't catch a missing tag, so check this yourself.
- When a claim gets its first test, remove its id from `docs/specs/untested.txt`. Run `npm run spec-check` to confirm.
- If the code and the spec disagree, ask which one is wrong rather than writing the test to match either. Known problems are listed in `docs/known-issues.md`.

## Interacting with the app

- Act and read through the UI, as a user would, so tests survive internal refactors.
- Find elements with `data-test-id` and the `testId(page, 'id')` helper. Add the attribute to the template or controller when it's missing, so tests don't depend on styling classes. When the work must not change the app, use the existing class in a `testutils.ts` helper instead, as `setLayerPreviewOpacity` and `assertOtherLayerOpacityOnCanvas` do.
- Avoid `window.pskl` internals. The accepted bridges are `setPiskelFromGrid` for fixtures, and `getPixelColor`, `readPixelGrid`, `readPixelRows`, `assertColorRows`, `drawAtPixel` and `assertOtherLayerOpacityOnCanvas`, which have no DOM alternative.
- When a test uses modifier keys, add a comment saying what each one does, because the keys alone don't tell the reader which behavior is being tested:

  ```ts
  // Shift applies the flip to all frames, Ctrl to all layers
  await clickTransform(page, 'tool-flip', { shift: true, ctrl: true });
  ```

## Asserting

- When testing the rendering in the canvas or any 2-dimensional artifact (e.g. the shape of the selection), use a matrix (2D array) or a list of strings instead of querying each position line by line, because the reader can visualize the content being asserted and stray pixels fail the test:

  ```ts
  expect(await readPixelRows(page, 4, 4)).toEqual([
    '...X',
    '...X',
    '.XXX',
    '....',
  ]);
  ```

- Write each grid one row per line, so it looks like the shape. Don't build grids with helpers or spreads, even for empty rows.
- Use a 10x10 square sprite by default, like a real canvas. Use a smaller sprite only to test an edge case, such as a 2x2 sprite for clipping, and a rectangular one only when the shape matters. Say why in a comment.
- `readPixelRows` only tells colored from transparent. When the color matters, use `assertColorRows`, whose grids show each color as a letter, never just "not transparent". Use `getPixelColor` and `colorToInt('#FF0000')` or `TRANSPARENT` only for a color without a letter.
- Work out expected values from the spec or by hand. Output copied from a run only proves the code does what it does.
- Assert the frame after each drawing action in the setup, as an ASCII grid when possible, so a broken setup fails at the step that caused it rather than later at the behavior being tested, and the reader can see the state at each step:

  ```ts
  await drawAtPixel(page, 1, 1);
  expect(await readPixelRows(page, 4, 4, 1, 1)).toEqual([
    '....',
    '.X..',
    '....',
    '....',
  ]);
  ```
- When an action has effects elsewhere in the app, check those effects as well as the local change, because a button updating its own look doesn't prove the feature works:

  ```ts
  // The eye icon changed, but are the other layers really hidden?
  await toggleLayerPreview(page);
  await assertLayerPreviewEnabled(page, false);
  await assertOtherLayerHiddenOnCanvas(page, 0, 0);
  ```

  Other examples:
  - After changing a layer's opacity, check the preview as well as the color of the α button.
  - After deleting a frame, check what the preview plays as well as the frame tiles.
  - When something should stay unchanged, check that too: changing the layer preview opacity must not change the animated preview.

- Use a screenshot only when the claim is about what's rendered. Screenshot the single element, not the page (unless it's a global test like an app-level layout), and avoid text.
- For animated content, use `assertPreviewPlays` rather than a screenshot, because a screenshot depends on timing.
- Make sure a test can fail. For "does nothing" claims, also check that no side effect happened, such as a history step: draw first, and check that undo removes the drawing. For claims about limits or timing, temporarily disable the behavior and confirm the test fails, because these tests can easily pass for the wrong reason.

## Timing

- Prefer polling (`waitForGrid`, `waitFor`, `expect(locator)`) over fixed waits.
- Undo and redo are ignored within 50ms of the previous one (`undo-redo.throttle`). Polling can finish sooner than that, so put `await wait(100)` between consecutive presses.

## Running

- `playwright.config.ts` sets `retries: 3`, which hides flakiness. Check new or changed tests with:

  ```sh
  npx playwright test <path> --retries=0 --repeat-each=5
  ```

- Before temporarily breaking the app to check that a test can fail, make sure nothing is already running on port 9001. Playwright reuses that server, so it can serve an old or broken build and the results won't count.
- Report the real result, including any test you didn't run.

## Mutation testing

After writing tests for a claim, break each behavior it covers, one at a time, and confirm a test fails. Restore `src/` after each one and check that `git diff` is empty. If a mutation isn't caught, either strengthen the test or explain why the mutation couldn't have failed it.

Report progress to the user every 5 mutations done, because mutation checks are long runs and the user wants to follow them. When they run in the background, watch their log; when they run in a subagent, have it notify the main agent every 5 mutations.

## Adding rules

This skill grows as we write tests. Always ask the user before adding anything to it, even a rule that seems obvious from their feedback, because they decide what becomes a standing rule. Add each approved rule to the section it belongs to, in one or two lines, with the reason when it isn't obvious.
