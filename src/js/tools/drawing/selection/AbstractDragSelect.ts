import { Constants } from "../../../Constants";
import type { Frame } from "../../../model/Frame";
import { BaseSelect } from "./BaseSelect";

export class AbstractDragSelect extends BaseSelect {
  constructor() {
    super();
  }

  /** @override */
  onSelectStart_(col: number, row: number, frame: Frame, overlay: Frame): void {
    if (this.hasSelection) {
      this.hasSelection = false;
      this.commitSelection();
    } else {
      this.hasSelection = true;
      this.onDragSelectStart_(col, row);
      overlay.setPixel(
        col,
        row,
        this.getTransparentVariant_(Constants.SELECTION_TRANSPARENT_COLOR)
      );
    }
  }

  /** @override */
  onSelect_(col: number, row: number, frame: Frame, overlay: Frame): void {
    if (
      !this.hasSelection &&
      (this.startCol !== col || this.startRow !== row)
    ) {
      this.hasSelection = true;
      this.onDragSelectStart_(col, row);
    }

    if (this.hasSelection) {
      this.onDragSelect_(col, row, frame, overlay);
    }
  }

  /** @override */
  onSelectEnd_(col: number, row: number, frame: Frame, overlay: Frame): void {
    if (this.hasSelection) {
      this.onDragSelectEnd_(col, row, frame, overlay);
    }
  }

  /** @private */
  startDragSelection_(col: number, row: number, overlay: Frame): void {
    this.hasSelection = true;
    this.onDragSelectStart_(col, row);
    overlay.setPixel(
      col,
      row,
      this.getTransparentVariant_(Constants.SELECTION_TRANSPARENT_COLOR)
    );
  }

  /** @protected */
  onDragSelectStart_(
    col: number,
    row: number,
    frame?: Frame,
    overlay?: Frame
  ): void {}

  /** @protected */
  onDragSelect_(col: number, row: number, frame: Frame, overlay: Frame): void {}

  /** @protected */
  onDragSelectEnd_(
    col: number,
    row: number,
    frame: Frame,
    overlay: Frame
  ): void {}
}
