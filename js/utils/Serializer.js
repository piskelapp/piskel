(function () {
  var ns = $.namespace('pskl.utils');
  ns.Serializer = {
    serializePiskel : function (piskel) {
      var serializedLayers = piskel.getLayers().map(function (l) {
        return pskl.utils.Serializer.serializeLayer(l);
      });
      return JSON.stringify({
        modelVersion : Constants.MODEL_VERSION,
        piskel : {
          height : piskel.getHeight(),
          width : piskel.getWidth(),
          fps : piskel.getFps(),
          layers : serializedLayers
        }
      });
    },

    serializeLayer : function (layer) {
      var serializedFrames = layer.getFrames().map(function (f) {
        return f.serialize();
      });
      return JSON.stringify({
        name : layer.getName(),
        frames : serializedFrames
      });
    },

    deserializePiskel : function (json) {
      var data = JSON.parse(json);
      if (data.modelVersion == Constants.MODEL_VERSION) {
        var pData = data.piskel;
        var layers = pData.layers.map(function (serializedLayer) {
          return pskl.utils.Serializer.deserializeLayer(serializedLayer);
        }); 
        var piskel = new pskl.model.Piskel(pData.width, pData.height, pData.fps);
        layers.forEach(function (layer) {
          piskel.addLayer(layer);
        });
        return piskel;
      } else {
        //  pre-layer implementation adapter
      }
    },

    deserializeLayer : function (json) {
      var lData = JSON.parse(json);
      var frames = lData.frames.map(function (serializedFrame) {
        return pskl.utils.Serializer.deserializeFrame(serializedFrame);
      });

      var layer = new pskl.model.Layer(lData.name);
      frames.forEach(function (frame) {
        layer.addFrame(frame);
      });
      return layer;
    },

    deserializeFrame : function (json) {
      var framePixelGrid = JSON.parse(json);
      return pskl.model.Frame.fromPixelGrid(framePixelGrid);
    }
  };
})();