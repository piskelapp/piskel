# Selection

## Purpose

Select part of a frame to move, delete, or copy it elsewhere, including to
another frame, layer, or another Piskel tab.

## Behavior

### Selection tools

| Claim | Tool | Key | Selects |
| --- | --- | --- | --- |
| `selection.rectangle` | Rectangle selection | `S` | The dragged rectangle. |
| `selection.lasso` | Lasso selection | `H` | A freeform area traced with the mouse. |
| `selection.shape` | Shape selection | `Z` | The contiguous region of the clicked color. |

- `selection.move-outline` Dragging inside an existing selection moves the
  selection outline.
- `selection.move-content` Holding `shift` while dragging moves the
  **content** with it.
- `selection.across-frames` The selection survives switching frames and
  layers, so content can be moved or pasted onto another frame/layer.
- `selection.dismiss-on-tool-change` Switching to a non-selection tool
  dismisses the selection.
- `selection.click-outside` With a selection active, pressing outside it
  with a selection tool commits it (moved content is applied) and
  dismisses it, without starting a new selection.
- `selection.move-cursor` Hovering the selection shows the move cursor.

### Actions

| Claim | Action | Shortcut | Effect |
| --- | --- | --- | --- |
| `selection.copy` | Copy | `ctrl+C` | Copies the selected pixels (also to the system clipboard). |
| `selection.cut` | Cut | `ctrl+X` | Copies, then clears the selected pixels. |
| `selection.paste` | Paste | `ctrl+V` | Pastes the copied pixels on the current frame, at the current position of the selection (after any move). Transparent pixels are not pasted, so they don't erase what is underneath. |
| `selection.delete` | Delete | `Del` / `Backspace` | Clears the selected pixels. |
| `selection.commit` | Commit | `Enter` | Applies moved content and dismisses the selection. |

- `selection.paste-other-tab` When pasting from the system clipboard,
  Piskel selection data copied from another Piskel tab is used, unless a
  newer local selection exists.
- `selection.paste-image` An **image** in the system clipboard is imported
  through the import flow (see [import.md](import.md)).
- `selection.undo` Cut, paste and delete are each a single undo step. Copy
  doesn't change the sprite.
- `selection.paste-empty` Pasting with nothing copied does nothing.
- `selection.paste-text` Pasting text that isn't Piskel selection data is
  ignored.
- `selection.clip` Content moved outside the canvas is clipped on commit.

## UI and shortcuts

Selection tools are in the left toolbar with the drawing tools. Shortcuts
are in the tables above.
