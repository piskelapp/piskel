describe("Canvas Renderer test", function() {
  var BLACK = '#000000';
  var WHITE = '#ffffff';
  var TRANS = Constants.TRANSPARENT_COLOR;

  var toFrameGrid = function (normalGrid) {
    var frameGrid = [];
    var w = normalGrid[0].length;
    var h = normalGrid.length;
    for (var x = 0 ; x < w ; x++) {
      frameGrid[x] = [];
      for (var y = 0 ; y < h ; y++) {
        frameGrid[x][y] = normalGrid[y][x];
      }
    }
    return frameGrid;
  };

  beforeEach(function() {});
  afterEach(function() {});

  it("draws transparent as white by default", function() {
    // create frame
    var frame = pskl.model.Frame.fromPixelGrid(toFrameGrid([
      [BLACK, TRANS],
      [TRANS, BLACK]
    ]));

    var renderer = new pskl.rendering.CanvasRenderer(frame, 1);
    var canvas = renderer.render();

    var frameFromCanvas = pskl.utils.FrameUtils.createFromImage(canvas);

    expect(frameFromCanvas.getPixel(0,0)).toBe(BLACK);
    expect(frameFromCanvas.getPixel(0,1)).toBe(WHITE);
    expect(frameFromCanvas.getPixel(1,0)).toBe(WHITE);
    expect(frameFromCanvas.getPixel(1,1)).toBe(BLACK);
  });
});