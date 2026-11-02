# Frames

## Purpose

Manage the frames of the animation: the timeline in the left column.

## Behavior

- A sprite always has at least one frame. Frame *i* exists in every layer;
  adding or removing a frame affects all layers.
- Each frame is shown as a tile with a thumbnail of all visible layers
  composed, and its number.
- **Select**: click a tile. `up` / `down` select the previous / next frame.
- **Add**: the "add new frame" tile at the bottom, or `N`, inserts an empty
  frame after the current one and selects it.
- **Duplicate**: the tile's clone action, or `shift+N`, inserts a copy after
  the frame.
- **Delete**: the tile's delete action. Hidden when there is only one frame.
- **Reorder**: drag a tile by its handle. Hidden when there is only one
  frame.
- **Toggle visibility**: clicking the frame number toggles whether the
  frame is played in the animated preview. Hidden frames are still edited,
  saved and **exported**; they are only skipped by the preview. Hidden
  frame indexes are kept in sync when frames are added, removed or moved,
  and they are saved in `.piskel` files.
- Every operation above, except selection, is one undo step.

### Edge cases

- Deleting the current frame selects the previous one (or the new first
  frame).
- With many frames, the list scrolls, with visual hints at the top and
  bottom when content overflows.

## UI and shortcuts

Frames list in the left column.
Shortcuts: `up`, `down`, `N`, `shift+N`.

## Settings

None.

## Test gaps

- `up` / `down` / `N` / `shift+N` shortcuts.
- Hidden frames are kept in sync after reordering or deleting frames.
- Hidden frames are saved in and loaded from `.piskel` files.

## Known issues

None documented.
