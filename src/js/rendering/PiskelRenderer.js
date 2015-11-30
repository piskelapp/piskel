(function () {

  var ns = $.namespace('pskl.rendering');

  ns.PiskelRenderer = function (piskelController) {
    var frames = [];
    for (var i = 0 ; i < piskelController.getFrameCount() ; i++) {
      frames.push(piskelController.getFrameAt(i));
    }
    ns.FramesheetRenderer.call(this, frames);
  };

  pskl.utils.inherit(ns.PiskelRenderer, ns.FramesheetRenderer);
})();
