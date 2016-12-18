(function () {
  var ns = $.namespace('pskl.utils');

  ns.LayerUtils = {
    mergeLayers : function (layerA, layerB) {
      var framesA = layerA.getFrames();
      var framesB = layerB.getFrames();
      var mergedFrames = [];
      framesA.forEach(function (frame, index) {
        var otherFrame = framesB[index];
        mergedFrames.push(pskl.utils.FrameUtils.merge([otherFrame, frame]));
      });
      var mergedLayer = pskl.model.Layer.fromFrames(layerA.getName(), mergedFrames);
      return mergedLayer;
    },

    getFrameHashAt : function (layers, index) {
      var hashBuffer = [];
      layers.forEach(function (l) {
        var frame = l.getFrameAt(index);
        hashBuffer.push(frame.getHash());
        hashBuffer.push(l.getOpacity());
        return frame;
      });
      return hashBuffer.join('-');
    },

    /**
     * Create a frame instance merging all the frames from the layers array at
     * the provided index.
     *
     * @param  {Array<Layer>} layers array of layers to use
     * @param  {Number} index frame index to merge
     * @return {Frame} Frame instance (can be a fake frame when using
     *         transparency)
     */
    mergeFrameAt : function (layers, index) {
      var isTransparent = layers.some(function (l) {return l.isTransparent();});
      if (isTransparent) {
        return pskl.utils.LayerUtils.mergeTransparentFrameAt_(layers, index);
      } else {
        return pskl.utils.LayerUtils.mergeOpaqueFrameAt_(layers, index);
      }
    },

    mergeTransparentFrameAt_ : function (layers, index) {
      var hash = pskl.utils.LayerUtils.getFrameHashAt(layers, index);
      var width = layers[0].frames[0].getWidth();
      var height = layers[0].frames[0].getHeight();
      var renderFn = function () {return pskl.utils.LayerUtils.flattenFrameAt(layers, index, true);};
      return new pskl.model.frame.RenderedFrame(renderFn, width, height, hash);
    },

    mergeOpaqueFrameAt_ : function (layers, index) {
      var hash = pskl.utils.LayerUtils.getFrameHashAt(layers, index);
      var frames = layers.map(function(l) {return l.getFrameAt(index);});
      var mergedFrame = pskl.utils.FrameUtils.merge(frames);
      mergedFrame.id = hash;
      mergedFrame.version = 0;
      return mergedFrame;
    },

    renderFrameAt : function (layer, index, preserveOpacity) {
      var opacity = preserveOpacity ? layer.getOpacity() : 1;
      var frame = layer.getFrameAt(index);
      return pskl.utils.FrameUtils.toImage(frame, 1, opacity);
    },

    flattenFrameAt : function (layers, index, preserveOpacity) {
      var width = layers[0].getFrameAt(index).getWidth();
      var height = layers[0].getFrameAt(index).getHeight();
      var canvas = pskl.utils.CanvasUtils.createCanvas(width, height);

      var context = canvas.getContext('2d');
      layers.forEach(function (l) {
        var render = ns.LayerUtils.renderFrameAt(l, index, preserveOpacity);
        context.drawImage(render, 0, 0, width, height, 0, 0, width, height);
      });

      return canvas;
    }
  };

})();
