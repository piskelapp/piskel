describe("PixelUtils visitor methods tests", function() {
  var black = '#000000';
  var red = '#ff0000';
  var transparent = Constants.TRANSPARENT_COLOR;
  var B = black, R = red, T = transparent;

  beforeEach(function() {});
  afterEach(function() {});

  var containsPixel = function (pixels, col, row) {
    return pixels.some(function (p) {
      return p.col === col && p.row === row;
    });
  };

  it("getSimilarConnectedPixelsFromFrame works", function() {
    var frame = pskl.model.Frame.fromPixelGrid(test.testutils.toFrameGrid([
      [T, T, B],
      [B, T, B],
      [T, T, B],
    ]));

    var pixels = pskl.PixelUtils.getSimilarConnectedPixelsFromFrame(frame, 0, 0);
    expect(pixels.length).toBe(5);
    expect(containsPixel(pixels, 0, 0)).toBe(true);
    expect(containsPixel(pixels, 1, 0)).toBe(true);
    expect(containsPixel(pixels, 1, 1)).toBe(true);
    expect(containsPixel(pixels, 0, 2)).toBe(true);
    expect(containsPixel(pixels, 1, 2)).toBe(true);

    pixels = pskl.PixelUtils.getSimilarConnectedPixelsFromFrame(frame, -1, -1);
    expect(Array.isArray(pixels)).toBe(true);
    expect(pixels.length).toBe(0);

    pixels = pskl.PixelUtils.getSimilarConnectedPixelsFromFrame(frame, 0, 1);
    expect(pixels.length).toBe(1);
    expect(containsPixel(pixels, 0, 1)).toBe(true);

    pixels = pskl.PixelUtils.getSimilarConnectedPixelsFromFrame(frame, 2, 1);
    expect(pixels.length).toBe(3);
    expect(containsPixel(pixels, 2, 0)).toBe(true);
    expect(containsPixel(pixels, 2, 1)).toBe(true);
    expect(containsPixel(pixels, 2, 2)).toBe(true);
  });
});
