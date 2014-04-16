(function () {
  var ns = $.namespace('pskl.utils');

  ns.Serializer = {
    serializePiskel : function (piskel, compressed) {
      var serializedLayers = piskel.getLayers().map(function (l) {
        return pskl.utils.Serializer.serializeLayer(l, compressed);
      });
      return JSON.stringify({
        modelVersion : Constants.MODEL_VERSION,
        piskel : {
          height : piskel.getHeight(),
          width : piskel.getWidth(),
          layers : serializedLayers
        }
      });
    },

    serializeLayer : function (layer, compressed) {
      if (compressed !== false) {
        compressed = true;
      }
      var frames = layer.getFrames();
      var renderer = new pskl.rendering.FramesheetRenderer(frames);
      var layerToSerialize = {
        name : layer.getName(),
        frameCount : frames.length
      };
      if (compressed) {
        layerToSerialize.base64PNG = renderer.renderAsCanvas().toDataURL();
        return JSON.stringify(layerToSerialize);
      } else {
        layerToSerialize.grids = frames.map(function (f) {return f.pixels;});
        return layerToSerialize;
      }
    }
  };
})();
