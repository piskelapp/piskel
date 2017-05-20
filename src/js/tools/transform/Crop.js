(function () {
  var ns = $.namespace('pskl.tools.transform');

  ns.Crop = function () {
    this.toolId = 'tool-crop';
    this.helpText = 'Crop the sprite';
    this.tooltipDescriptors = [
      {
        description : 'Crop to fit the content or the selection. ' +
                      'Applies to all frames and layers!'
      }
    ];
  };

  pskl.utils.inherit(ns.Crop, ns.AbstractTransformTool);

  ns.Crop.prototype.applyToolOnFrame_ = function (frame, altKey) {
    var currentPiskel = pskl.app.piskelController.getPiskel();
    var frames = currentPiskel.getLayers().map(function (l) {
      return l.getFrames();
    }).reduce(function (p, n) {
      return p.concat(n);
    });

    var boundaries = pskl.tools.transform.TransformUtils.getBoundaries(frames);
    if (boundaries.minx >= boundaries.maxx) {
      return;
    }

    var width = 1 + boundaries.maxx - boundaries.minx;
    var height = 1 + boundaries.maxy - boundaries.miny;

    if (width === currentPiskel.getWidth() && height === currentPiskel.getHeight()) {
      // Do not perform an unnecessary resize if it's a noop.
      return;
    }

    frames.forEach(function (frame) {
      pskl.tools.transform.TransformUtils.moveFramePixels(frame, -boundaries.minx, -boundaries.miny);
    });

    var piskel = pskl.utils.ResizeUtils.resizePiskel(currentPiskel, {
      width :  1 + boundaries.maxx - boundaries.minx,
      height :  1 + boundaries.maxy - boundaries.miny,
      origin: 'TOP-LEFT',
      resizeContent: false
    });

    pskl.app.piskelController.setPiskel(piskel, {
      preserveState: true,
      noSnapshot: true
    });
  };

})();
