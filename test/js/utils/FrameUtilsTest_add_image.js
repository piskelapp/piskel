describe("FrameUtils addImageToFrame tests", function() {
  var black = '#000000';
  var red = '#ff0000';
  var transparent = Constants.TRANSPARENT_COLOR;
  var B = black, R = red, T = transparent;

  // shortcuts
  var toFrameGrid = test.testutils.toFrameGrid;

  /**
   * The three helpers below enable using only "visual" grids, while
   * most frame helpers use rotated grids.
   */
  var frameEqualsGrid = function (frame, grid) {
    test.testutils.frameEqualsGrid(frame, grid);
  };

  var createFrameFromGrid = function (grid) {
    return pskl.model.Frame.fromPixelGrid(toFrameGrid(grid));
  };

  var createImageFromGrid = function (grid) {
    return pskl.utils.FrameUtils.toImage(createFrameFromGrid(grid));
  };

  it("adds smaller image at drop position", function () {
    // Transparent frame 2x2
    var frame = createFrameFromGrid([
      [T, T],
      [T, T]
    ]);

    // Single red pixel image
    var image = createImageFromGrid([[R]]);

    pskl.utils.FrameUtils.addImageToFrame(frame, image, 0, 0);

    // Verify
    frameEqualsGrid(frame, [
      [R, T],
      [T, T]
    ]);

    pskl.utils.FrameUtils.addImageToFrame(frame, image, 1, 1);
    // Verify
    frameEqualsGrid(frame, [
      [R, T],
      [T, R]
    ]);
  });

  it("adds line image at drop position", function () {
    // Transparent frame 2x2
    var frame = createFrameFromGrid([
      [T, T],
      [T, T]
    ]);

    // Line of 2 red pixels
    var image = createImageFromGrid([[R, R]]);

    pskl.utils.FrameUtils.addImageToFrame(frame, image, 0, 0);

    // Verify
    frameEqualsGrid(frame, [
      [R, R],
      [T, T]
    ]);

    pskl.utils.FrameUtils.addImageToFrame(frame, image, 0, 1);

    // Verify
    frameEqualsGrid(frame, [
      [R, R],
      [R, R]
    ]);
  });

  it("does not erase under transparent areas", function () {
    // Black frame 2x2
    var frame = createFrameFromGrid([
      [B, B],
      [B, B]
    ]);

    // 2x2 image with 3 transparent pixels and a red pixel
    var image = createImageFromGrid([
      [T, T],
      [T, R]
    ]);

    pskl.utils.FrameUtils.addImageToFrame(frame, image, 0, 0);

    // Verify
    frameEqualsGrid(frame, [
      [B, B],
      [B, R]
    ]);
  });

  it("offsets drop position", function () {
    // Transparent frame 2x2
    var frame = createFrameFromGrid([
      [T, T],
      [T, T]
    ]);

    // Line of 2 red pixels
    var image = createImageFromGrid([
      [R, R]
    ]);

    // Drop it on the right side, should be moved back to te left
    pskl.utils.FrameUtils.addImageToFrame(frame, image, 1, 0);

    // Verify
    frameEqualsGrid(frame, [
      [R, R],
      [T, T]
    ]);
  });

  it("offsets drop position take 2", function () {
    // Transparent frame 2x2
    var frame = createFrameFromGrid([
      [T, T],
      [T, T]
    ]);

    // 2x2 image
    var image = createImageFromGrid([
      [B, R],
      [R, B]
    ]);

    pskl.utils.FrameUtils.addImageToFrame(frame, image, 1, 1);

    // Verify
    frameEqualsGrid(frame, [
      [B, R],
      [R, B]
    ]);
  });
});