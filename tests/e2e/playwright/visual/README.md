# Visual tests

A storyboard of the UI: one spec per visual area, showing each visual state
once. They check how the app looks, while the `integration` tests check how it
behaves.

## Commands

| Command | Use |
| --- | --- |
| `npm run visual` | Compare with the committed baselines. Only meaningful in the CI container. |
| `npm run visual:local` | Compare with `tmp-visual-local/`, to write tests on any machine. Add `-- --update-snapshots` to create that folder. |
| `npm run visual:storyboard` | Build a page with all the committed screenshots, in `tmp-visual-storyboard/index.html`. Add `-- tests/e2e/playwright/tmp-visual-local` to show your local ones instead. |

Committed baselines come only from the **Update visual baselines** GitHub
workflow, which runs in the same container as the `visual` CI job. Run it on a
branch after an intended visual change. Screenshots from another machine won't
match, because fonts differ.

## Writing a state

- Only states that can't coexist get separate screenshots. Pack independent
  states into one, and say what it shows in a comment.
- Show one example of each repeated look, such as one selected tool. Which
  button is enabled when is logic: the integration tests cover that.
- Name screenshots `area--state`, so that they sort as a storyboard.
- Set a viewport with `test.use` rather than resizing just after loading, which
  races the first fit of the canvas.
- Call `moveMouseAway` before a screenshot, unless it's about hovering.

## Not covered, on purpose

| State | Why |
| --- | --- |
| Native `prompt` and `confirm` | Drawn by the browser, not the page |
| NW.js desktop save buttons | The desktop app is planned for removal, and has no spec |
| CSS cursors of the tools | Not visible in screenshots |
| Dead code such as `.gif-upload-status` | No user can reach it |
| Bugs from `docs/known-issues.md` | A baseline shouldn't lock in a bug |
| Tool column below about 580px of height | It clips the color swatches, so the picker can't be opened |
