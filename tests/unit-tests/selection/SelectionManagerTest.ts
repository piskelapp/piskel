import { Constants } from "../../../src/js/Constants";
import { Events } from "../../../src/js/Events";
import { app } from "../../../src/js/app";
import type { PublicPiskelController } from "../../../src/js/controller/piskel/PublicPiskelController";
import type { JQueryEvent } from "../../../src/js/lib/jquery-1.8.0";
import { Frame } from "../../../src/js/model/Frame";
import {
  BaseSelection,
  type SelectionPixel
} from "../../../src/js/selection/BaseSelection";
import { SelectionManager } from "../../../src/js/selection/SelectionManager";
import type { ShortcutService } from "../../../src/js/service/keyboard/ShortcutService";
import {
  type Color,
  compareColor,
  frameEqualsGrid,
  mock
} from "../testutils/TestUtils";
import { beforeEach, describe, expect, it } from "vitest";

describe("SelectionManager suite", function () {
  const black = "#000000";
  const red = "#ff0000";
  const transparent = Constants.TRANSPARENT_COLOR;
  const B = black,
    R = red,
    T = transparent;

  // shortcuts

  // test objects
  let selectionManager: SelectionManager;
  let selection: BaseSelection;
  let currentFrame: Frame;

  /**
   * @Mock
   */
  app.shortcutService = mock<ShortcutService>({
    registerShortcut: function () {}
  });

  /**
   * @Mock
   */
  const piskelController = {
    getCurrentFrame: function () {
      return currentFrame;
    }
  };

  /**
   * @Mock
   */
  const createMockCopyEvent = function () {
    return {
      clipboardData: {
        items: [],
        setData: function () {}
      },
      preventDefault: function () {}
    };
  };

  /**
   * @Mock
   */
  const createMockTextClipboardItem = function (text: string) {
    return {
      type: "text/plain",
      getAsString: function (callback: (text: string) => void) {
        callback(text);
      }
    };
  };

  beforeEach(function () {
    currentFrame = Frame.fromPixelGrid([
      [B, R, T],
      [R, B, R],
      [T, R, B]
    ]);

    selectionManager = new SelectionManager(
      mock<PublicPiskelController>(piskelController)
    );
    selectionManager.init();

    selection = new BaseSelection();

    selection.pixels = [];
  });

  /**
   * Check a basic copy paste scenario
   */
  it("copy/paste OK", function () {
    console.log("[SelectionManager] copy/paste OK");
    selectMiddleLine();

    console.log("[SelectionManager] ... copy");
    selectionManager.copy(
      mock<JQueryEvent>({ type: Events.CLIPBOARD_COPY }),
      mock<ClipboardEvent>(createMockCopyEvent())
    );

    console.log(
      "[SelectionManager] ... check selection content after copy contains correct colors"
    );
    expect(selection.pixels.length).toBe(3); // or not to be ... lalalala ... french-only joke \o/
    checkContainsPixel(selection.pixels, 1, 0, R);
    checkContainsPixel(selection.pixels, 1, 1, B);
    checkContainsPixel(selection.pixels, 1, 2, R);

    console.log("[SelectionManager] ... move 1 row down");
    selection.move(0, 1);

    console.log(
      "[SelectionManager] ... check pixels were shifted by two columns forward"
    );
    checkContainsPixel(selection.pixels, 2, 0, R);
    checkContainsPixel(selection.pixels, 2, 1, B);
    checkContainsPixel(selection.pixels, 2, 2, R);

    console.log("[SelectionManager] ... paste");
    selectionManager.paste(
      mock<JQueryEvent>({ type: Events.CLIPBOARD_PASTE }),
      mock<ClipboardEvent>(createMockCopyEvent())
    );

    console.log(
      "[SelectionManager] ... check last line is identical to middle line after paste"
    );
    frameEqualsGrid(currentFrame, [
      [B, R, T],
      [R, B, R],
      [R, B, R]
    ]);
  });

  /**
   * Check that pasting text which is not a piskel selection is ignored
   */
  it("paste ignores random text from the clipboard", function () {
    // Browsers call getAsString callbacks asynchronously, outside of paste()'s try/catch,
    // so call pasteText_ directly to make sure it doesn't throw by itself.
    ["Some random text", "null", "42", "{}"].forEach(function (text) {
      expect(function () {
        selectionManager.pasteText_(
          mock<DataTransferItem>(createMockTextClipboardItem(text))
        );
      }).not.toThrow();
    });

    frameEqualsGrid(currentFrame, [
      [B, R, T],
      [R, B, R],
      [T, R, B]
    ]);
  });

  /**
   * Check a basic cut paste scenario
   */
  it("cut OK", function () {
    console.log("[SelectionManager] cut OK");
    selectMiddleLine();

    console.log("[SelectionManager] ... cut");
    selectionManager.copy(
      mock<JQueryEvent>({ type: Events.CLIPBOARD_CUT }),
      mock<ClipboardEvent>(createMockCopyEvent())
    );

    console.log(
      "[SelectionManager] ... check middle line was cut in the source frame"
    );
    frameEqualsGrid(currentFrame, [
      [B, R, T],
      [T, T, T],
      [T, R, B]
    ]);

    console.log("[SelectionManager] ... paste");
    selectionManager.paste(
      mock<JQueryEvent>({ type: Events.CLIPBOARD_PASTE }),
      mock<ClipboardEvent>(createMockCopyEvent())
    );

    console.log(
      "[SelectionManager] ... check middle line was restored by paste"
    );
    frameEqualsGrid(currentFrame, [
      [B, R, T],
      [R, B, R],
      [T, R, B]
    ]);
  });

  /**
   * Check a copy paste scenario that goes out of the frame boundaries for copying and for pasting.
   */
  it("copy/paste OK out of bounds", function () {
    console.log("[SelectionManager] copy/paste OK out of bounds");
    selectMiddleLine();

    console.log("[SelectionManager] ... move 2 columns to the right");
    selection.move(2, 0);

    console.log("[SelectionManager] ... copy out of bounds");
    selectionManager.copy(
      mock<JQueryEvent>({ type: Events.CLIPBOARD_COPY }),
      mock<ClipboardEvent>(createMockCopyEvent())
    );
    console.log(
      "[SelectionManager] ... check out of bound pixels were replaced by transparent pixels"
    );
    checkContainsPixel(selection.pixels, 1, 2, R);
    checkContainsPixel(selection.pixels, 1, 3, T);
    checkContainsPixel(selection.pixels, 1, 4, T);

    console.log("[SelectionManager] ... move one column to the left");
    selection.move(-1, 0);

    console.log(
      "[SelectionManager] ... check pixels were shifted by one column back"
    );
    checkContainsPixel(selection.pixels, 1, 1, R);
    checkContainsPixel(selection.pixels, 1, 2, T);
    checkContainsPixel(selection.pixels, 1, 3, T);

    console.log("[SelectionManager] ... paste out of bounds");
    selectionManager.paste(
      mock<JQueryEvent>({ type: Events.CLIPBOARD_PASTE }),
      mock<ClipboardEvent>(createMockCopyEvent())
    );

    console.log(
      "[SelectionManager] ... check pixel at (1,1) is red after paste"
    );
    frameEqualsGrid(currentFrame, [
      [B, R, T],
      [R, R, R],
      [T, R, B]
    ]);
  });

  /**
   * Check a cut paste scenario that goes out of the frame boundaries for cutting and for pasting.
   */
  it("cut OK out of bounds", function () {
    console.log("[SelectionManager] cut OK");
    selectMiddleLine();

    console.log("[SelectionManager] ... move 2 columns to the right");
    selection.move(2, 0);

    console.log("[SelectionManager] ... cut out of bounds");
    selectionManager.copy(
      mock<JQueryEvent>({ type: Events.CLIPBOARD_CUT }),
      mock<ClipboardEvent>(createMockCopyEvent())
    );
    console.log(
      "[SelectionManager] ... check last pixel of midle line was cut in the source frame"
    );
    frameEqualsGrid(currentFrame, [
      [B, R, T],
      [R, B, T],
      [T, R, B]
    ]);

    selection.move(-1, 0);

    console.log("[SelectionManager] ... paste out of bounds");
    selectionManager.paste(
      mock<JQueryEvent>({ type: Events.CLIPBOARD_PASTE }),
      mock<ClipboardEvent>(createMockCopyEvent())
    );

    console.log("[SelectionManager] ... check middle line final state");
    frameEqualsGrid(currentFrame, [
      [B, R, T],
      [R, R, T],
      [T, R, B]
    ]);
  });

  // Private helpers
  const createPixel = function (row: number, col: number, color?: string) {
    return {
      row: row,
      col: col,
      color: color
    };
  };

  const selectMiddleLine = function () {
    console.log("[SelectionManager] ... select middle line");
    selection.pixels.push(createPixel(1, 0));
    selection.pixels.push(createPixel(1, 1));
    selection.pixels.push(createPixel(1, 2));

    expect(selectionManager.currentSelection).toBe(null);
    console.log(
      "[SelectionManager] ... send SELECTION_CREATED event for the test selection"
    );
    $.publish(Events.SELECTION_CREATED, [selection]);
    expect(selectionManager.currentSelection).toBe(selection);
  };

  const checkContainsPixel = function (
    pixels: SelectionPixel[],
    row: number,
    col: number,
    color: Color
  ) {
    const containsPixel = pixels.some(function (pixel: SelectionPixel) {
      return (
        pixel.row == row &&
        pixel.col == col &&
        compareColor(mock<Color>(pixel.color), color)
      );
    });
    expect(containsPixel).toBe(true);
  };
});
