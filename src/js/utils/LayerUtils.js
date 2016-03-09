(function () {
  var ns = $.namespace('pskl.utils');

  ns.LayerUtils = {
    /**
     * Create a Frame array from an Image object.
     * Transparent pixels will either be converted to completely opaque or completely transparent pixels.
     * TODO : move to FrameUtils
     *
     * @param  {Image} image source image
     * @param  {Number} frameCount number of frames in the spritesheet
     * @return {Array<Frame>}
     */
    createFramesFromSpritesheet : function (image, frameCount) {
      var width = image.width;
      var height = image.height;
      var frameWidth = width / frameCount;

      var canvas = pskl.utils.CanvasUtils.createCanvas(frameWidth, height);
      var context = canvas.getContext('2d');

      // Draw the zoomed-up pixels to a different canvas context
      var frames = [];
      for (var i = 0 ; i < frameCount ; i++) {
        context.clearRect(0, 0 , frameWidth, height);
        context.drawImage(image, frameWidth * i, 0, frameWidth, height, 0, 0, frameWidth, height);
        var frame = pskl.utils.FrameUtils.createFromImage(canvas);
        frames.push(frame);
      }
      return frames;
    },

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
