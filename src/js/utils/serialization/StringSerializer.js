(function () {
  var ns = $.namespace('pskl.utils');

  ns.StringSerializer = {
    serializePiskel : function (piskel) {
      var serializedLayers = piskel.getLayers().map(function (l) {
        return pskl.utils.StringSerializer.serializeLayer(l);
      });
      return JSON.stringify({
        modelVersion : 2,
        piskel : {
          name : piskel.getDescriptor().name,
          description : piskel.getDescriptor().description,
          fps : pskl.app.piskelController.getFPS(),
          height : piskel.getHeight(),
          width : piskel.getWidth(),
          layers : serializedLayers
        }
      });
    },

    serializeLayer : function (layer) {
      var frames = layer.getFrames();
      var layerToSerialize = {
        name : layer.getName(),
        opacity : layer.getOpacity(),
        frameCount : frames.length
      };
      var renderer = new pskl.rendering.FramesheetRenderer(frames);
      layerToSerialize.base64PNG = renderer.renderAsCanvas().toDataURL();
      return JSON.stringify(layerToSerialize);
    }
  };
})();
