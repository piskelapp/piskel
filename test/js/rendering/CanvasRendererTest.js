describe("Canvas Renderer test", function() {
  var BLACK = '#000000';
  var WHITE = '#ffffff';
  var TRANS = Constants.TRANSPARENT_COLOR;

  beforeEach(function() {});
  afterEach(function() {});

  it("draws transparent as white by default", function() {
    // create frame
    var frame = pskl.model.Frame.fromPixelGrid(test.testutils.toFrameGrid([
      [BLACK, TRANS],
      [TRANS, BLACK]
    ]));

    var renderer = new pskl.rendering.CanvasRenderer(frame, 1);
    var canvas = renderer.render();

    var frameFromCanvas = pskl.utils.FrameUtils.createFromImage(canvas);

    test.testutils.colorEqualsColor(frameFromCanvas.getPixel(0,0), BLACK);
    test.testutils.colorEqualsColor(frameFromCanvas.getPixel(0,1), WHITE);
    test.testutils.colorEqualsColor(frameFromCanvas.getPixel(1,0), WHITE);
    test.testutils.colorEqualsColor(frameFromCanvas.getPixel(1,1), BLACK);
  });
});