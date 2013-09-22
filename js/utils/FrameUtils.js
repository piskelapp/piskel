(function () {
  var ns = $.namespace('pskl.utils');

  ns.FrameUtils = {
    merge : function (frames) {
      var merged = frames[0].clone();
      var w = merged.getWidth(), h = merged.getHeight();
      for (var i = 1 ; i < frames.length ; i++) {
        pskl.utils.FrameUtils.mergeFrames_(merged, frames[i]);
      }
      return merged;
    },

    mergeFrames_ : function (frameA, frameB) {
      frameB.forEachPixel(function (p, col, row) {
        if (p != Constants.TRANSPARENT_COLOR) {
          frameA.setPixel(col, row, p);
        }
      });
    }
  };
})();