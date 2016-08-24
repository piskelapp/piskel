(function () {
  var ns = $.namespace('pskl.utils');

  ns.Serializer = {
    serializePiskel : function (piskel, expanded) {
      var serializedLayers = piskel.getLayers().map(function (l) {
        return pskl.utils.Serializer.serializeLayer(l, expanded);
      });
      return JSON.stringify({
        modelVersion : Constants.MODEL_VERSION,
        piskel : {
          name : piskel.getDescriptor().name,
          description : piskel.getDescriptor().description,
          fps : pskl.app.piskelController.getFPS(),
          height : piskel.getHeight(),
          width : piskel.getWidth(),
          layers : serializedLayers,
          expanded : expanded
        }
      });
    },

    serializeLayer : function (layer, expanded) {
      var frames = layer.getFrames();
      var layerToSerialize = {
        name : layer.getName(),
        opacity : layer.getOpacity(),
        frameCount : frames.length
      };
      if (expanded) {
        layerToSerialize.grids = frames.map(function (f) {return Array.prototype.slice.call(f.pixels);});
        return layerToSerialize;
      } else {
        var renderer = new pskl.rendering.FramesheetRenderer(frames);
        layerToSerialize.base64PNG = renderer.renderAsCanvas().toDataURL();
        return JSON.stringify(layerToSerialize);
      }
    }
  };
})();
