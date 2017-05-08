describe("MergeUtils suite", function() {
  var B = '#000000';
  var R = '#ff0000';
  var T = Constants.TRANSPARENT_COLOR;

  var createPiskelFromGrid = function (grid, name) {
    var frame = pskl.model.Frame.fromPixelGrid(grid);
    var layer = pskl.model.Layer.fromFrames("l1", [frame]);
    return pskl.model.Piskel.fromLayers([layer], 12, {
      name: name || "piskel",
      description: "desc"
    });
  };

  /**
   * Simple helper to create a monochrome sprite for the provided color,
   * number of rows and columns.
   */
  var getPiskel = function (color, rows, cols) {
    var grid = [];
    for (var i = 0 ; i < rows ; i++) {
      grid[i] = [];
      for (var j = 0 ; j < cols ; j++) {
        grid[i][j] = color;
      }
    }
    return createPiskelFromGrid(grid);
  };

  it("merges 2 piskel - insertMode:add same size", function () {
    var piskel1 = getPiskel(B, 2, 2);
    var piskel2 = getPiskel(R, 2, 2);

    var mergedPiskel = pskl.utils.MergeUtils.merge(piskel1, piskel2, {
      index: 0,
      resize: "expand",
      origin: "TOPLEFT",
      insertMode: "add"
    });

    expect(mergedPiskel.getWidth()).toBe(2);
    expect(mergedPiskel.getHeight()).toBe(2);
    expect(mergedPiskel.getLayers().length).toBe(2);
    expect(mergedPiskel.getLayers()[0].getFrames().length).toBe(2);
  });

  it("merges 2 piskel - insertMode:insert same size", function () {
    var piskel1 = getPiskel(B, 2, 2);
    var piskel2 = getPiskel(R, 2, 2);

    var mergedPiskel = pskl.utils.MergeUtils.merge(piskel1, piskel2, {
      index: 0,
      resize: "expand",
      origin: "TOPLEFT",
      insertMode: "insert"
    });

    expect(mergedPiskel.getWidth()).toBe(2);
    expect(mergedPiskel.getHeight()).toBe(2);
    expect(mergedPiskel.getLayers().length).toBe(2);
    expect(mergedPiskel.getLayers()[0].getFrames().length).toBe(1);
  });

  it("merges 2 piskel - resize:expand with bigger imported piskel", function () {
    var piskel1 = getPiskel(B, 2, 2);
    var piskel2 = getPiskel(R, 4, 4);

    var mergedPiskel = pskl.utils.MergeUtils.merge(piskel1, piskel2, {
      index: 0,
      resize: "expand",
      origin: "TOPLEFT",
      insertMode: "insert"
    });

    expect(mergedPiskel.getWidth()).toBe(4);
    expect(mergedPiskel.getHeight()).toBe(4);
  });

  it("merges 2 piskel - resize:keep with bigger imported piskel", function () {
    var piskel1 = getPiskel(B, 2, 2);
    var piskel2 = getPiskel(R, 4, 4);

    var mergedPiskel = pskl.utils.MergeUtils.merge(piskel1, piskel2, {
      index: 0,
      resize: "keep",
      origin: "TOPLEFT",
      insertMode: "insert"
    });

    expect(mergedPiskel.getWidth()).toBe(2);
    expect(mergedPiskel.getHeight()).toBe(2);
  });

  it("merges 2 piskel - resize:expand with taller but thinner imported piskel", function () {
    var piskel1 = getPiskel(B, 2, 2);
    var piskel2 = getPiskel(R, 1, 4);

    var mergedPiskel = pskl.utils.MergeUtils.merge(piskel1, piskel2, {
      index: 0,
      resize: "expand",
      origin: "TOPLEFT",
      insertMode: "insert"
    });

    expect(mergedPiskel.getWidth()).toBe(2);
    expect(mergedPiskel.getHeight()).toBe(4);
  });

  it("merges 2 piskel - resize:expand with wider but shorter imported piskel", function () {
    var piskel1 = getPiskel(B, 2, 2);
    var piskel2 = getPiskel(R, 4, 1);

    var mergedPiskel = pskl.utils.MergeUtils.merge(piskel1, piskel2, {
      index: 0,
      resize: "expand",
      origin: "TOPLEFT",
      insertMode: "insert"
    });

    expect(mergedPiskel.getWidth()).toBe(4);
    expect(mergedPiskel.getHeight()).toBe(2);
  });

  it("merges 2 piskel - resize:expand with bigger original piskel", function () {
    var piskel1 = getPiskel(B, 3, 3);
    var piskel2 = getPiskel(R, 1, 1);

    var mergedPiskel = pskl.utils.MergeUtils.merge(piskel1, piskel2, {
      index: 0,
      resize: "expand",
      origin: "TOPLEFT",
      insertMode: "insert"
    });

    expect(mergedPiskel.getWidth()).toBe(3);
    expect(mergedPiskel.getHeight()).toBe(3);
  });

  it("merges 2 piskel - resize:keep with bigger original piskel", function () {
    var piskel1 = getPiskel(B, 3, 3);
    var piskel2 = getPiskel(R, 1, 1);

    var mergedPiskel = pskl.utils.MergeUtils.merge(piskel1, piskel2, {
      index: 0,
      resize: "keep",
      origin: "TOPLEFT",
      insertMode: "insert"
    });

    expect(mergedPiskel.getWidth()).toBe(3);
    expect(mergedPiskel.getHeight()).toBe(3);
  });
});
