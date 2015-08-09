(function () {
  var ns = $.namespace('test.testutils');

  /**
   * Frame.createFromGrid accepts grids that are rotated by 90deg from
   * the visual/usual way. (column-based grid)
   *
   * For testing, it's easier for be able to specify a row-based grid, because
   * it visually matches what the image will look like.
   *
   * For instance :
   *
   * [[black, black, black],
   *  [white, white, white]]
   *
   * we expect this to be a 3x2 image, one black line above a white line.
   *
   * However Frame.createFromGrid needs the following input to create such an image :
   * 
   * [[black, white],
   *  [black, white],
   *  [black, white]] 
   *
   * This helper will build the second array from the first array.
   */
  ns.toFrameGrid = function (normalGrid) {
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

  ns.frameEqualsGrid = function (frame, grid) {
    frame.forEachPixel(function (color, col, row) {
      expect(color).toBe(grid[row][col]);
    });
  };
})();