(function () {
  var ns = $.namespace('pskl.service.pensize');

  ns.PenSizeService = function () {};

  ns.PenSizeService.prototype.init = function () {
    this.size = pskl.UserSettings.get('PEN_SIZE');
  };

  ns.PenSizeService.prototype.setPenSize = function (size) {
    if (size != this.size) {
      this.size = size;
      pskl.UserSettings.set('PEN_SIZE', size);
      $.publish(Events.PEN_SIZE_CHANGED);
    }
  };

  ns.PenSizeService.prototype.getPenSize = function () {
    return this.size;
  };

  ns.PenSizeService.prototype.getPixelsForPenSize = function (col, row, penSize) {
    var size = penSize || this.size;
    if (size == 1) {
      return [[col, row]];
    } else if (size == 2) {
      return [
        [col, row], [col + 1, row],
        [col, row + 1], [col + 1, row + 1]
      ];
    } else if (size == 3) {
      return [
        [col - 1, row - 1], [col, row - 1], [col + 1, row - 1],
        [col - 1, row + 0], [col, row + 0], [col + 1, row + 0],
        [col - 1, row + 1], [col, row + 1], [col + 1, row + 1],
      ];
    } else if (size == 4) {
      return [
        [col - 1, row - 1], [col, row - 1], [col + 1, row - 1], [col + 2, row - 1],
        [col - 1, row + 0], [col, row + 0], [col + 1, row + 0], [col + 2, row + 0],
        [col - 1, row + 1], [col, row + 1], [col + 1, row + 1], [col + 2, row + 1],
        [col - 1, row + 2], [col, row + 2], [col + 1, row + 2], [col + 2, row + 2],
      ];
    }
  };
})();
