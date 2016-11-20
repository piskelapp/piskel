(function () {
  var ns = $.namespace('pskl.service.performance');

  /**
   * We consider that piskel should behave correctly for a sprite with the following specs:
   * - 256*256
   * - 30 frames
   * - 5 layers
   * - 30 colors
   * Based on these assumptions, as well as a few arbitrary hard limits we try to check
   * if the provided sprite might present a performance issue.
   *
   * @param {Piskel} piskel the sprite to analyze
   * @param {Number} colorsCount number of colors for the current sprite
   *        (not part of the piskel model so has to be provided separately).
   */
  ns.PerformanceReport = function (piskel, colorsCount) {
    var pixels = piskel.getWidth() * piskel.getHeight();
    this.resolution = pixels > (500 * 500);

    var layersCount = piskel.getLayers().length;
    this.layers = layersCount > 25;

    var framesCount = piskel.getLayerAt(0).size();
    this.frames = framesCount > 100;

    this.colors = colorsCount > 100;

    var overallScore = (pixels / 2500) + (layersCount * 4) + framesCount + colorsCount;
    this.overall = overallScore > 100;
  };

  ns.PerformanceReport.prototype.equals = function (report) {
    return (report instanceof ns.PerformanceReport &&
      this.resolution == report.resolution &&
      this.layers == report.layers &&
      this.frames == report.frames &&
      this.colors == report.colors &&
      this.overall == report.overall);
  };

  ns.PerformanceReport.prototype.hasProblem = function () {
    return this.resolution || this.layers || this.frames || this.colors || this.overall;
  };
})();
