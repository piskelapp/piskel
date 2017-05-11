describe("LayerUtils test", function() {

  var B = '#000000';
  var R = '#ff0000';
  var T = Constants.TRANSPARENT_COLOR;
  var frameEqualsGrid = test.testutils.frameEqualsGrid;
  var imageEqualsGrid = test.testutils.imageEqualsGrid;

  var frame1 = pskl.model.Frame.fromPixelGrid([
    [B, T],
    [T, B]
  ]);

  var frame2 = pskl.model.Frame.fromPixelGrid([
    [T, R],
    [R, T]
  ]);

  beforeEach(function() {});
  afterEach(function() {});

  it("flattens a frame", function() {
    // when
    var l1 = new pskl.model.Layer('l1');
    l1.addFrame(frame1);
    var l2 = new pskl.model.Layer('l2');
    l2.addFrame(frame2);

    // then
    var flattened = pskl.utils.LayerUtils.flattenFrameAt([l1, l2], 0);

    //verify
    imageEqualsGrid(flattened, [
      [B, R],
      [R, B]
    ]);
  });

  it("flattens a frame with opacity", function() {
    // when
    var l1 = new pskl.model.Layer('l1');
    l1.addFrame(frame1);
    var l2 = new pskl.model.Layer('l2');
    l2.setOpacity(0.5);
    l2.addFrame(frame2);

    // then
    var flattened = pskl.utils.LayerUtils.flattenFrameAt([l1, l2], 0, true);

    //verify
    imageEqualsGrid(flattened, [
      [B, 'rgba(255,0,0,0.5)'],
      ['rgba(255,0,0,0.5)', B]
    ]);
  });

  it("clones a layer", function() {
    var grid1 = [
      [B, T],
      [T, B]
    ];

    var grid2 = [
      [R, B],
      [B, R]
    ];

    // when
    var layer = new pskl.model.Layer('l1');
    layer.addFrame(pskl.model.Frame.fromPixelGrid(grid1));
    layer.addFrame(pskl.model.Frame.fromPixelGrid(grid2));

    // then
    var clone = pskl.utils.LayerUtils.clone(layer);
    var clonedFrame = clone.getFrameAt(0);

    // verify
    frameEqualsGrid(clone.getFrameAt(0), grid1);
    frameEqualsGrid(clone.getFrameAt(1), grid2);
    expect(clone.getName()).toBe('l1 (clone)');
  });
});