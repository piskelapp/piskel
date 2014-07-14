(function () {
  var flipFrame = function (frame, horizontal, vertical) {
    var clone = frame.clone();
    var w = frame.getWidth();
    var h = frame.getHeight();
    clone.forEachPixel(function (color, x, y) {
      if (horizontal) {
        x = w-x-1;
      }
      if (vertical) {
        y = h-y-1;
      }
      frame.pixels[x][y] = color;
    });
    frame.version++;
  };

  window.flip = function (horizontal, vertical) {
    var currentFrameIndex = pskl.app.piskelController.getCurrentFrameIndex();
    var layers = pskl.app.piskelController.getLayers();
    layers.forEach(function (layer) {
      flipFrame(layer.getFrameAt(currentFrameIndex), horizontal, vertical);
    });
    $.publish(Events.PISKEL_RESET);
    $.publish(Events.PISKEL_SAVE_STATE, {
      type : pskl.service.HistoryService.SNAPSHOT
    });
  };

  window.copyToAll = function () {
    var ref = pskl.app.piskelController.getCurrentFrame();
    var layer = pskl.app.piskelController.getCurrentLayer();
    layer.getFrames().forEach(function (frame) {
      if (frame !==  ref) {
        frame.setPixels(ref.getPixels());
      }
    });
    $.publish(Events.PISKEL_RESET);
    $.publish(Events.PISKEL_SAVE_STATE, {
      type : pskl.service.HistoryService.SNAPSHOT
    });
  };
})();