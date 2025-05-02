(function () {
  var ns = $.namespace('pskl.controller');

  ns.PixelStatsController = function () {
    this.pixelStatsService = null;
  };

  ns.PixelStatsController.prototype.init = function () {
    this.pixelStatsService = new pskl.service.PixelStatsService();
    this.pixelStatsService.init();

    this.pixelStatsContainer = document.querySelector('.pixel-stats-container');
    this.colorTemplate = pskl.utils.Template.get('pixel-stats-color-template');

    this.totalPixelsEl = this.pixelStatsContainer.querySelector(
      '.pixel-stats-total-pixels'
    );
    this.usedPixelsEl = this.pixelStatsContainer.querySelector(
      '.pixel-stats-used-pixels'
    );
    this.transparencyEl = this.pixelStatsContainer.querySelector(
      '.pixel-stats-transparency'
    );
    this.colorCountEl = this.pixelStatsContainer.querySelector(
      '.pixel-stats-color-count'
    );
    this.colorsContainerEl = this.pixelStatsContainer.querySelector(
      '.pixel-stats-colors-container'
    );

    [
      Events.PISKEL_RESET,
      Events.PISKEL_SAVE_STATE,
      Events.FRAME_SIZE_CHANGED,
      Events.USER_SETTINGS_CHANGED,
      Events.SELECTION_CREATED,
      Events.SELECTION_MOVED,
      Events.SELECTION_DISMISSED,
      Events.LAYER_ADD,
      Events.LAYER_REMOVE,
      Events.LAYER_MOVE,
      Events.LAYER_TOGGLE,
      Events.FRAME_SAVE,
      Events.FRAME_CHANGED,
      Events.TOOL_RELEASED
    ].forEach(function(event) {
      $.subscribe(event, this.updateStats.bind(this));
    }.bind(this));

    this.updateStats();
  };

  ns.PixelStatsController.prototype.updateStats = function () {
    if (!this.pixelStatsService || !this.pixelStatsContainer) {
      return;
    }

    var currentLayer = pskl.app.piskelController.getCurrentLayer();
    if (!currentLayer) {
      return;
    }

    var stats = this.pixelStatsService.getPixelStats(currentLayer);

    this.totalPixelsEl.textContent = stats.totalPixels;
    this.usedPixelsEl.textContent =
      stats.totalNonTransparent +
      ' (' +
      ((stats.totalNonTransparent / stats.totalPixels) * 100).toFixed(1) +
      '%)';
    this.transparencyEl.textContent = stats.transparency + '%';
    this.colorCountEl.textContent = stats.colorStats.length;

    this.colorsContainerEl.innerHTML = '';
    stats.colorStats.forEach(
      function (colorStat) {
        var html = pskl.utils.Template.replace(this.colorTemplate, {
          color: colorStat.color,
          count: colorStat.count,
          percentage: colorStat.percentage,
        });
        var colorEl = pskl.utils.Template.createFromHTML(html);
        this.colorsContainerEl.appendChild(colorEl);
      }.bind(this)
    );
  };
})();
