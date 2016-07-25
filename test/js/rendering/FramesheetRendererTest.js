describe("Framesheet Renderer test", function() {
  var B = '#000000';
  var W = '#ffffff';
  var T = Constants.TRANSPARENT_COLOR;

  var toFrameGrid = test.testutils.toFrameGrid;
  var frameEqualsGrid = test.testutils.frameEqualsGrid;

  beforeEach(function() {});
  afterEach(function() {});

  var toFrame = function (array) {
    return pskl.model.Frame.fromPixelGrid(toFrameGrid(array));
  };

  it("draws frames side by side by default", function() {
    // create frames
    var f1 = toFrame([[B, T],
                      [B, W]]);
    var f2 = toFrame([[W, B],
                      [T, B]]);

    var renderer = new pskl.rendering.FramesheetRenderer([f1, f2]);
    var canvas = renderer.renderAsCanvas();
    frameEqualsGrid(pskl.utils.FrameUtils.createFromImage(canvas), [
      [B, T, W, B],
      [B, W, T, B]
    ]);
  });

  it("renderAsCanvas accepts columns argument", function() {
    // create frames
    var f1 = toFrame([[B, B]]);
    var f2 = toFrame([[W, W]]);
    var f3 = toFrame([[T, W]]);
    var f4 = toFrame([[B, W]]);
    var frames = [f1, f2, f3, f4];

    // columns = 4
    var renderer = new pskl.rendering.FramesheetRenderer(frames);
    var canvas = renderer.renderAsCanvas(4);
    frameEqualsGrid(pskl.utils.FrameUtils.createFromImage(canvas), [
      [B, B, W, W, T, W, B, W]
    ]);

    // columns = 3
    renderer = new pskl.rendering.FramesheetRenderer(frames);
    canvas = renderer.renderAsCanvas(3);
    frameEqualsGrid(pskl.utils.FrameUtils.createFromImage(canvas), [
      [B, B, W, W, T, W],
      [B, W, T, T, T, T]
    ]);

    // columns = 2
    renderer = new pskl.rendering.FramesheetRenderer(frames);
    canvas = renderer.renderAsCanvas(2);
    frameEqualsGrid(pskl.utils.FrameUtils.createFromImage(canvas), [
      [B, B, W, W],
      [T, W, B, W]
    ]);

    // columns = 1
    renderer = new pskl.rendering.FramesheetRenderer(frames);
    canvas = renderer.renderAsCanvas(1);
    frameEqualsGrid(pskl.utils.FrameUtils.createFromImage(canvas), [
      [B, B],
      [W, W],
      [T, W],
      [B, W]
    ]);
  });
});