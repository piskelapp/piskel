describe("FrameUtils suite", function() {
  var black = '#000000';
  var red = '#ff0000';
  var transparent = Constants.TRANSPARENT_COLOR;

  it("merges 2 frames", function () {
    var frame1 = pskl.model.Frame.fromPixelGrid([
      [black, transparent],
      [transparent, black]
    ]);

    var frame2 = pskl.model.Frame.fromPixelGrid([
      [transparent, red],
      [red, transparent]
    ]);

    var mergedFrame = pskl.utils.FrameUtils.merge([frame1, frame2]);
    expect(mergedFrame.getPixel(0,0)).toBe(black);
    expect(mergedFrame.getPixel(0,1)).toBe(red);
    expect(mergedFrame.getPixel(1,0)).toBe(red);
    expect(mergedFrame.getPixel(1,1)).toBe(black);
  });

  it("returns same frame when merging single frame", function () {
    var frame1 = pskl.model.Frame.fromPixelGrid([
      [black, transparent],
      [transparent, black]
    ]);

    var mergedFrame = pskl.utils.FrameUtils.merge([frame1]);
    expect(mergedFrame.getPixel(0,0)).toBe(black);
    expect(mergedFrame.getPixel(0,1)).toBe(transparent);
    expect(mergedFrame.getPixel(1,0)).toBe(transparent);
    expect(mergedFrame.getPixel(1,1)).toBe(black);
  });

  var checkPixelsColor = function (frame, pixels, color) {
    pixels.forEach(function (pixel) {
      var pixelColor = frame.getPixel(pixel[0], pixel[1]);
      expect(pixelColor).toBe(color);
    });
  };

  it ("converts an image to a frame", function () {
    var frame1 = pskl.model.Frame.fromPixelGrid([
      [black, transparent],
      [transparent, black]
    ]);

    var image = pskl.utils.FrameUtils.toImage(frame1);
    expect(image.width).toBe(2);
    expect(image.height).toBe(2);

    var biggerImage = pskl.utils.FrameUtils.toImage(frame1, 3);
    expect(biggerImage.width).toBe(6);
    expect(biggerImage.height).toBe(6);

    var biggerFrame = pskl.utils.FrameUtils.createFromImage(biggerImage);

    checkPixelsColor(biggerFrame, [
      [0,0],[0,1],[0,2],
      [1,0],[1,1],[1,2],
      [2,0],[2,1],[2,2],
      [3,3],[3,4],[3,5],
      [4,3],[4,4],[4,5],
      [5,3],[5,4],[5,5]
    ], black);

    checkPixelsColor(biggerFrame, [
      [0,3],[0,4],[0,5],
      [1,3],[1,4],[1,5],
      [2,3],[2,4],[2,5],
      [3,0],[3,1],[3,2],
      [4,0],[4,1],[4,2],
      [5,0],[5,1],[5,2]
    ], transparent);
  });

  it ("[LayerUtils] creates a layer from a simple spritesheet", function () {
    var frame = pskl.model.Frame.fromPixelGrid([
      [black, red],
      [red, black],
      [black, black],
      [red, red]
    ]);
    var spritesheet = pskl.utils.FrameUtils.toImage(frame);

    var frames = pskl.utils.LayerUtils.createLayerFromSpritesheet(spritesheet, 4);
    expect(frames.length).toBe(4);

    expect(frames[0].getPixel(0,0)).toBe(black);
    expect(frames[0].getPixel(0,1)).toBe(red);

    expect(frames[1].getPixel(0,0)).toBe(red);
    expect(frames[1].getPixel(0,1)).toBe(black);

    expect(frames[2].getPixel(0,0)).toBe(black);
    expect(frames[2].getPixel(0,1)).toBe(black);

    expect(frames[3].getPixel(0,0)).toBe(red);
    expect(frames[3].getPixel(0,1)).toBe(red);

  });
});