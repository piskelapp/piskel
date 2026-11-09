import { Constants } from "../Constants";
import { Events } from "../Events";
import { app } from "../app";
import type { PublicPiskelController } from "../controller/piskel/PublicPiskelController";
import type { JQueryEvent } from "../lib/jquery-1.8.0";
import type { Frame } from "../model/Frame";
import { HistoryService } from "../service/HistoryService";
import { Shortcuts } from "../service/keyboard/Shortcuts";
import type { BaseTool } from "../tools/drawing/BaseTool";
import { BaseSelect } from "../tools/drawing/selection/BaseSelect";
import { FileUtils } from "../utils/FileUtils";
import { assertDefined } from "../utils/core";
import type { BaseSelection, SelectionPixel } from "./BaseSelection";

const SELECTION_REPLAY = {
  PASTE: "REPLAY_PASTE",
  ERASE: "REPLAY_ERASE"
};

export class SelectionManager {
  piskelController: PublicPiskelController;
  currentSelection: BaseSelection | null;

  constructor(piskelController: PublicPiskelController) {
    this.piskelController = piskelController;

    this.currentSelection = null;
  }

  init(): void {
    $.subscribe(Events.SELECTION_CREATED, this.onSelectionCreated_.bind(this));
    $.subscribe(
      Events.SELECTION_DISMISSED,
      this.onSelectionDismissed_.bind(this)
    );
    $.subscribe(
      Events.SELECTION_MOVE_REQUEST,
      this.onSelectionMoved_.bind(this)
    );
    $.subscribe(Events.CLIPBOARD_COPY, this.copy.bind(this));
    $.subscribe(Events.CLIPBOARD_CUT, this.copy.bind(this));
    $.subscribe(Events.CLIPBOARD_PASTE, this.paste.bind(this));

    const shortcuts = Shortcuts;
    assertDefined(app.shortcutService, "shortcutService").registerShortcut(
      shortcuts.SELECTION.DELETE,
      this.onDeleteShortcut_.bind(this)
    );
    assertDefined(app.shortcutService, "shortcutService").registerShortcut(
      shortcuts.SELECTION.COMMIT,
      this.commit.bind(this)
    );

    $.subscribe(Events.TOOL_SELECTED, this.onToolSelected_.bind(this));
  }

  /**
   * @private
   */
  cleanSelection_(): void {
    if (this.currentSelection) {
      this.currentSelection.reset();
      this.currentSelection = null;
    }
  }

  /**
   * @private
   */
  onToolSelected_(evt: JQueryEvent, tool: BaseTool): void {
    const isSelectionTool = tool instanceof BaseSelect;
    if (!isSelectionTool) {
      this.cleanSelection_();
    }
  }

  /**
   * @private
   */
  onSelectionDismissed_(evt: JQueryEvent): void {
    this.cleanSelection_();
  }

  onDeleteShortcut_(key: string): boolean | undefined {
    if (this.currentSelection) {
      this.erase();
    } else {
      return true; // bubble
    }
  }

  erase(): void {
    const pixels = assertDefined(
      this.currentSelection,
      "currentSelection"
    ).pixels;
    const currentFrame = this.piskelController.getCurrentFrame();
    for (let i = 0, l = pixels.length; i < l; i++) {
      currentFrame.setPixel(
        pixels[i].col,
        pixels[i].row,
        Constants.TRANSPARENT_COLOR
      );
    }

    $.publish(Events.PISKEL_SAVE_STATE, {
      type: HistoryService.REPLAY,
      scope: this,
      replay: {
        type: SELECTION_REPLAY.ERASE,
        pixels: JSON.parse(JSON.stringify(pixels))
      }
    });
  }

  copy(event: JQueryEvent, domEvent?: ClipboardEvent): void {
    if (this.currentSelection && this.piskelController.getCurrentFrame()) {
      this.currentSelection.fillSelectionFromFrame(
        this.piskelController.getCurrentFrame()
      );
      if (domEvent) {
        assertDefined(domEvent.clipboardData, "clipboardData").setData(
          "text/plain",
          this.currentSelection.stringify()
        );
        domEvent.preventDefault();
      }
      if (event.type === Events.CLIPBOARD_CUT) {
        this.erase();
      }
    }
  }

  paste(event: JQueryEvent, domEvent?: ClipboardEvent): void {
    const items: ArrayLike<DataTransferItem> = domEvent
      ? assertDefined(domEvent.clipboardData, "clipboardData").items
      : [];

    try {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        if (/^image/i.test(item.type)) {
          this.pasteImage_(item);
          event.stopPropagation();
          return;
        }

        if (/^text\/plain/i.test(item.type)) {
          this.pasteText_(item);
          event.stopPropagation();
          return;
        }
      }
    } catch {
      // Some of the clipboard APIs are not available on Safari/IE
      // Allow Piskel to fallback on local currentSelection pasting.
    }

    // temporarily keeping this code path for tests and fallbacks.
    if (this.currentSelection && this.currentSelection.hasPastedContent) {
      this.pastePixelsOnCurrentFrame_(this.currentSelection.pixels);
    }
  }

  pasteImage_(clipboardItem: DataTransferItem): void {
    const blob = assertDefined(clipboardItem.getAsFile(), "blob");
    FileUtils.readImageFile(
      blob,
      (image: HTMLImageElement | HTMLCanvasElement) => {
        assertDefined(
          app.fileDropperService,
          "fileDropperService"
        ).dropPosition_ = { x: 0, y: 0 };
        assertDefined(
          app.fileDropperService,
          "fileDropperService"
        ).onImageLoaded_(image, blob);
      }
    );
  }

  pasteText_(clipboardItem: DataTransferItem): void {
    const _blob = clipboardItem.getAsString((selectionString: string) => {
      let selectionData: { time: number; pixels: SelectionPixel[] } | undefined;
      try {
        // TODO: ideally we should validate the parsed data against a piskel selection
        // schema instead of accepting any arbitrary JSON as a valid selection.
        selectionData = JSON.parse(selectionString);
      } catch {
        // The clipboard does not contain a potential piskel selection, dropping.
        return;
      }

      if (!selectionData) {
        return;
      }

      const time = selectionData.time;
      let pixels = selectionData.pixels;

      const selectionTime = this.currentSelection && this.currentSelection.time;
      if (
        selectionTime !== undefined &&
        selectionTime !== null &&
        selectionTime >= time
      ) {
        // If the local selection is newer or equal to the one coming from the clipboard event
        // use the local one. The reason is that the "move" information is only updated locally
        // without synchronizing it to the clipboard.
        // TODO: the selection should store the origin of the selection and the selection itself
        // separately.
        pixels = assertDefined(
          this.currentSelection,
          "currentSelection"
        ).pixels;
      }

      if (pixels) {
        // If the current clipboard data is some random text, pixels will not be defined.
        this.pastePixelsOnCurrentFrame_(pixels);
      }
    });
  }

  pastePixelsOnCurrentFrame_(pixels: SelectionPixel[]): void {
    const frame = this.piskelController.getCurrentFrame();

    this.pastePixels_(frame, pixels);

    $.publish(Events.PISKEL_SAVE_STATE, {
      type: HistoryService.REPLAY,
      scope: this,
      replay: {
        type: SELECTION_REPLAY.PASTE,
        pixels: JSON.parse(JSON.stringify(pixels.slice(0)))
      }
    });
  }

  /**
   * If the currently selected tool is a selection tool, call commitSelection handler on
   * the current tool instance.
   */
  commit(): void {
    const tool = assertDefined(
      app.drawingController,
      "drawingController"
    ).currentToolBehavior;
    if (tool instanceof BaseSelect) {
      tool.commitSelection();
    }
  }

  replay(
    frame: Frame,
    replayData: { type: string; pixels: SelectionPixel[] }
  ): void {
    if (replayData.type === SELECTION_REPLAY.PASTE) {
      this.pastePixels_(frame, replayData.pixels);
    } else if (replayData.type === SELECTION_REPLAY.ERASE) {
      replayData.pixels.forEach(function (pixel: { col: number; row: number }) {
        frame.setPixel(pixel.col, pixel.row, Constants.TRANSPARENT_COLOR);
      });
    }
  }

  pastePixels_(frame: Frame, pixels: SelectionPixel[]): void {
    pixels.forEach(function (pixel: SelectionPixel) {
      if (
        pixel.color === Constants.TRANSPARENT_COLOR ||
        pixel.color === null ||
        pixel.color === undefined
      ) {
        return;
      }
      frame.setPixel(pixel.col, pixel.row, pixel.color);
    });
  }

  /**
   * @private
   */
  onSelectionCreated_(evt: JQueryEvent, selection: BaseSelection): void {
    if (selection) {
      this.currentSelection = selection;
    } else {
      console.error("No selection provided to SelectionManager");
    }
  }

  /**
   * @private
   */
  onSelectionMoved_(evt: JQueryEvent, colDiff: number, rowDiff: number): void {
    if (this.currentSelection) {
      this.currentSelection.move(colDiff, rowDiff);
    } else {
      console.error(
        "Bad state: No currentSelection set when trying to move it in SelectionManager"
      );
    }
  }
}
