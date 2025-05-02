describe("SelectionManager suite", function() {
  var black = '#000000';
  var red = '#ff0000';
  var transparent = Constants.TRANSPARENT_COLOR;
  var B = black, R = red, T = transparent;

  // shortcuts
  var toFrameGrid = test.testutils.toFrameGrid;
  var frameEqualsGrid = test.testutils.frameEqualsGrid;

  // test objects
  var selectionManager;
  var selection;
  var currentFrame;

  /**
   * @Mock
   */
  pskl.app.shortcutService = {
    registerShortcut : function () {}
  };

  /**
   * @Mock
   */
  var piskelController = {
    getCurrentFrame : function () {
      return currentFrame;
    }
  };

  /**
   * @Mock
   */
  var createMockCopyEvent = function () {
    return {
      clipboardData: {
        items: [],
        setData: function () {}
      },
      preventDefault: function () {}
    };
  };

  beforeEach(function() {
    currentFrame = pskl.model.Frame.fromPixelGrid([
      [B, R, T],
      [R, B, R],
      [T, R, B]
    ]);

    selectionManager = new pskl.selection.SelectionManager(piskelController);
    selectionManager.init();

    selection = new pskl.selection.BaseSelection();

    selection.pixels = [];
  });

  /**
   * Check a basic copy paste scenario
   */
  it("copy/paste OK", function () {
    console.log('[SelectionManager] copy/paste OK');
    selectMiddleLine();

    console.log('[SelectionManager] ... copy');
    selectionManager.copy({ type: Events.CLIPBOARD_COPY }, createMockCopyEvent());

    console.log('[SelectionManager] ... check selection content after copy contains correct colors');
    expect(selection.pixels.length).toBe(3); // or not to be ... lalalala ... french-only joke \o/
    checkContainsPixel(selection.pixels, 1, 0, R);
    checkContainsPixel(selection.pixels, 1, 1, B);
    checkContainsPixel(selection.pixels, 1, 2, R);

    console.log('[SelectionManager] ... move 1 row down');
    selection.move(0, 1);

    console.log('[SelectionManager] ... check pixels were shifted by two columns forward');
    checkContainsPixel(selection.pixels, 2, 0, R);
    checkContainsPixel(selection.pixels, 2, 1, B);
    checkContainsPixel(selection.pixels, 2, 2, R);

    console.log('[SelectionManager] ... paste');
    selectionManager.paste({ type: Events.CLIPBOARD_PASTE }, createMockCopyEvent());

    console.log('[SelectionManager] ... check last line is identical to middle line after paste');
    frameEqualsGrid(currentFrame, [
      [B, R, T],
      [R, B, R],
      [R, B, R]
    ]);
  });

  /**
   * Check a basic cut paste scenario
   */
  it("cut OK", function () {
    console.log('[SelectionManager] cut OK');
    selectMiddleLine();

    console.log('[SelectionManager] ... cut');
    selectionManager.copy({ type: Events.CLIPBOARD_CUT }, createMockCopyEvent());

    console.log('[SelectionManager] ... check middle line was cut in the source frame');
    frameEqualsGrid(currentFrame, [
      [B, R, T],
      [T, T, T],
      [T, R, B]
    ]);

    console.log('[SelectionManager] ... paste');
    selectionManager.paste({ type: Events.CLIPBOARD_PASTE }, createMockCopyEvent());

    console.log('[SelectionManager] ... check middle line was restored by paste');
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
    console.log('[SelectionManager] copy/paste OK out of bounds');
    selectMiddleLine();

    console.log('[SelectionManager] ... move 2 columns to the right');
    selection.move(2, 0);

    console.log('[SelectionManager] ... copy out of bounds');
    selectionManager.copy({ type: Events.CLIPBOARD_COPY }, createMockCopyEvent());
    console.log('[SelectionManager] ... check out of bound pixels were replaced by transparent pixels');
    checkContainsPixel(selection.pixels, 1, 2, R);
    checkContainsPixel(selection.pixels, 1, 3, T);
    checkContainsPixel(selection.pixels, 1, 4, T);

    console.log('[SelectionManager] ... move one column to the left');
    selection.move(-1, 0);

    console.log('[SelectionManager] ... check pixels were shifted by one column back');
    checkContainsPixel(selection.pixels, 1, 1, R);
    checkContainsPixel(selection.pixels, 1, 2, T);
    checkContainsPixel(selection.pixels, 1, 3, T);

    console.log('[SelectionManager] ... paste out of bounds');
    selectionManager.paste({ type: Events.CLIPBOARD_PASTE }, createMockCopyEvent());

    console.log('[SelectionManager] ... check pixel at (1,1) is red after paste');
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
    console.log('[SelectionManager] cut OK');
    selectMiddleLine();

    console.log('[SelectionManager] ... move 2 columns to the right');
    selection.move(2, 0);

    console.log('[SelectionManager] ... cut out of bounds');
    selectionManager.copy({ type: Events.CLIPBOARD_CUT }, createMockCopyEvent());
    console.log('[SelectionManager] ... check last pixel of middle line was cut in the source frame');
    frameEqualsGrid(currentFrame, [
      [B, R, T],
      [R, B, T],
      [T, R, B]
    ]);

    selection.move(-1, 0);

    console.log('[SelectionManager] ... paste out of bounds');
    selectionManager.paste({ type: Events.CLIPBOARD_PASTE }, createMockCopyEvent());

    console.log('[SelectionManager] ... check middle line final state');
    frameEqualsGrid(currentFrame, [
      [B, R, T],
      [R, R, T],
      [T, R, B]
    ]);
  });

  // Private helpers
  var createPixel = function(row, col, color) {
    return {
      row : row,
      col : col,
      color : color
    };
  };

  var selectMiddleLine = function () {
    console.log('[SelectionManager] ... select middle line');
    selection.pixels.push(createPixel(1, 0));
    selection.pixels.push(createPixel(1, 1));
    selection.pixels.push(createPixel(1, 2));

    expect(selectionManager.currentSelection).toBe(null);
    console.log('[SelectionManager] ... send SELECTION_CREATED event for the test selection');
    $.publish(Events.SELECTION_CREATED, [selection]);
    expect(selectionManager.currentSelection).toBe(selection);
  };

  var checkContainsPixel = function (pixels, row, col, color) {
    var containsPixel = pixels.some(function (pixel) {
      return pixel.row == row && pixel.col == col && test.testutils.compareColor(pixel.color, color);
    });
    expect(containsPixel).toBe(true);
  };

});