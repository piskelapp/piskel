describe("PixelUtils test suite", function() {

  beforeEach(function() {});
  afterEach(function() {});

  var checkPixel = function (pixel, col, row) {
    expect(pixel.col).toBe(col);
    expect(pixel.row).toBe(row);
  };

  var checkPixels = function (pixels /*, expectedPoints ... */) {
    var expectedPoints = Array.prototype.slice.call(arguments, 1);
    pixels.forEach(function (pixel, i) {
      checkPixel(pixel, expectedPoints[i][0],  expectedPoints[i][1]);
    });
  };

  var logPixels = function (pixels) {
    var buffer = [];
    pixels.forEach(function (p) {
      buffer.push('[' + p.col + ',' + p.row + ']');
    });
    console.log(buffer.join(','));
  };

  it("calculates line pixels", function() {
    // single point
    console.log('Check getLinePixels(0, 0, 0, 0)');
    var pixels = pskl.PixelUtils.getLinePixels(0, 0, 0, 0);
    expect(pixels.length).toBe(1);
    checkPixel(pixels[0], 0, 0);

    // 2-points line
    console.log('Check getLinePixels(0, 1, 0, 1)');
    pixels = pskl.PixelUtils.getLinePixels(0, 1, 0, 1);
    expect(pixels.length).toBe(2);
    checkPixel(pixels[0], 0, 0);
    checkPixel(pixels[1], 1, 1);

    // same line as before, reversed order
    console.log('Check getLinePixels(1, 0, 1, 0)');
    pixels = pskl.PixelUtils.getLinePixels(1, 0, 1, 0);
    expect(pixels.length).toBe(2);
    // check pixels are returned in reverse order
    checkPixel(pixels[0], 1, 1);
    checkPixel(pixels[1], 0, 0);

    // non trivial line
    console.log('Check getLinePixels(0, 2, 0, 7)');
    pixels = pskl.PixelUtils.getLinePixels(0, 2, 0, 7);
    expect(pixels.length).toBe(8);
    checkPixels(pixels, [0,0],[0,1],[1,2],[1,3],[1,4],[1,5],[2,6],[2,7]);
  });

  it("calculates uniform line pixels", function() {
    // single point
    console.log('Check getUniformLinePixels(0, 0, 0, 0)');
    var pixels = pskl.PixelUtils.getUniformLinePixels(0, 0, 0, 0);
    expect(pixels.length).toBe(1);
    checkPixel(pixels[0], 0, 0);

    // 2-points line
    console.log('Check getUniformLinePixels(0, 1, 0, 1)');
    pixels = pskl.PixelUtils.getUniformLinePixels(0, 1, 0, 1);
    expect(pixels.length).toBe(2);
    checkPixel(pixels[0], 0, 0);
    checkPixel(pixels[1], 1, 1);

    // same line as before, reversed order
    console.log('Check getUniformLinePixels(1, 0, 1, 0)');
    pixels = pskl.PixelUtils.getUniformLinePixels(1, 0, 1, 0);
    expect(pixels.length).toBe(2);
    // check pixels are returned in reverse order
    checkPixel(pixels[0], 1, 1);
    checkPixel(pixels[1], 0, 0);

    // computed step should be 2, min dist is 3 (y1 -y0 + 1)-> step should be applied
    console.log('Check getUniformLinePixels(0, 5, 0, 2)');
    pixels = pskl.PixelUtils.getUniformLinePixels(0, 5, 0, 2);
    expect(pixels.length).toBe(6);
    checkPixels(pixels, [0,0],[1,0],[2,1],[3,1],[4,2],[5,2]);

    // computed step should be 3, min dist is 2 (y1 -y0 + 1)-> step > minDist -> straight line
    console.log('Check getUniformLinePixels(0, 5, 0, 1)');
    pixels = pskl.PixelUtils.getUniformLinePixels(0, 5, 0, 1);
    expect(pixels.length).toBe(7);
    checkPixels(pixels, [0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0]);

    // non trivial line
    console.log('Check getUniformLinePixels(0, 2, 0, 7)');
    pixels = pskl.PixelUtils.getUniformLinePixels(0, 2, 0, 7);
    expect(pixels.length).toBe(8);
    checkPixels(pixels, [0,0],[0,1],[0,2],[1,3],[1,4],[1,5],[2,6],[2,7]);
  });
});