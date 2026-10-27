# Selection

## Purpose

Select part of a frame to move, delete, or copy it elsewhere, including to
another frame, layer, or another Piskel tab.

## Behavior

### Selection tools

| Tool | Id | Key | Selects |
| --- | --- | --- | --- |
| Rectangle selection | `tool-rectangle-select` | `S` | The dragged rectangle. |
| Lasso selection | `tool-lasso-select` | `H` | A freeform area traced with the mouse. |
| Shape selection | `tool-shape-select` | `Z` | The contiguous region of the clicked color. |

- Dragging inside an existing selection moves the selection outline.
  Holding `shift` while dragging moves the **content** with it.
- The selection survives switching frames and layers, so content can be
  moved or pasted onto another frame/layer.
- Switching to a non-selection tool dismisses the selection.

### Actions

| Action | Shortcut | Effect |
| --- | --- | --- |
| Copy | `ctrl+C` | Copies the selected pixels (also to the system clipboard). |
| Cut | `ctrl+X` | Copies, then clears the selected pixels. |
| Paste | `ctrl+V` | Pastes the copied pixels on the current frame, at the current position of the selection (after any move). Transparent pixels are not pasted, so they don't erase what is underneath. |
| Delete | `Del` / `Backspace` | Clears the selected pixels. |
| Commit | `Enter` | Applies moved content and dismisses the selection. |

- Pasting from the system clipboard:
  - Piskel selection data copied from another Piskel tab is used, unless a
    newer local selection exists.
  - An **image** in the clipboard is imported through the import flow (see
    [import.md](import.md)).
- Cut, paste and delete are each a single undo step. Copy doesn't change
  the sprite.

### Edge cases

- Pasting with nothing copied does nothing.
- Content moved outside the canvas is clipped on commit.

## UI and shortcuts

Selection tools are in the left toolbar with the drawing tools. Shortcuts
are in the table above.

## Settings

None.

## Test gaps

- Moving content with `shift`, then committing with `Enter`.
- Pasting onto another frame or layer.
- Pasting an image from the system clipboard.

## Known issues

None documented.
