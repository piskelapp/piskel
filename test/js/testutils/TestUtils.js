(function () {
  var ns = $.namespace('test.testutils');

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