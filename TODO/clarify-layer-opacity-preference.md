# Clarify the "Layer opacity" preference

**Status:** not started, and the solution isn't decided. Found while writing the
`layers` e2e tests on PR #1313. That work deliberately made no app change, so only
the tests were clarified.

## The problem

The app uses "layer opacity" for two different settings:

| | Layer's own opacity | The preference |
| --- | --- | --- |
| **Where it's set** | α button on each layer | Preferences > Misc > "Layer opacity" slider |
| **Applies to** | One layer, saved with the sprite | All sprites, saved in the browser |
| **What it does** | Changes that layer in the preview and exports, and on the canvas while it isn't the current layer | Sets how faintly the _other_ layers show on the canvas, multiplied by their own opacity |
| **Spec claims** | `layers.opacity` | `settings.layer-opacity`, `layers.preview-opacity` |
| **Code** | `Layer.getOpacity`, `setLayerOpacityAt` | `pskl.UserSettings.LAYER_OPACITY` |

Both are shown to the user as "Layer opacity": the tooltip of the α button is
`Layer opacity (0.5)`, and the slider is labelled `Layer opacity`.

The preference is only used by layer preview (`LayersRenderer`), so its value
has no effect on the animated preview or on exports. Setting it to 0 also turns
layer preview off (`MiscPreferencesController.onLayerOpacityChange_`).

## The goal

A user should be able to tell the two settings apart. How to do that is open: it
could be a new label, a tooltip, or something else.

## Useful to know

- **Space in the drawer:** the row is tight. With the slider's current layout, a
  longer label such as "Layer preview opacity" pushes the `0.20` value onto its
  own line, so a longer label also needs a layout change. This was checked with a
  screenshot of the drawer.
- **Names in the tests:** the tests already call the preference "layer preview
  opacity", as a working name, in `setLayerPreviewOpacity`,
  `assertLayerPreviewOpacity` and the test titles and comments of
  `integration/layers/test-layer-operations.spec.ts` and
  `integration/settings/test-preferences-misc/test-preferences-misc.spec.ts`. If
  the solution settles on another name, align them.
- **Names in the specs:** the specs use the UI's name, "Layer opacity", and
  `docs/specs/settings.md` says not to confuse the preference with the α button.
  Update them if the UI changes.
- **Test ids:** the slider and its value have no `data-test-id`, so the two helpers
  above use the `.layer-opacity-input` and `.layer-opacity-text` styling classes.
  `.claude/skills/e2e-tests/SKILL.md` asks for test ids, so add them if the
  template is being changed anyway.
- **Internal names:** renaming the `LAYER_OPACITY` setting key would need a
  migration, because the value is already saved in users' browsers.

## Checks

Run the layers and settings tests without retries, and look at the drawer if its
layout changed:

```sh
npx playwright test tests/e2e/playwright/integration/layers tests/e2e/playwright/integration/settings --retries=0
```

## Cleanup after the fix

- Remove the entry from "Layers" in `docs/known-issues.md`.
- Delete this file.
