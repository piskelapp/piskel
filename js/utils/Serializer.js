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
      var piskel = null;
      var data = JSON.parse(json);
      if (data.modelVersion == Constants.MODEL_VERSION) {
        var pData = data.piskel;
        piskel = new pskl.model.Piskel(pData.width, pData.height);

        pData.layers.forEach(function (serializedLayer) {
          var layer = pskl.utils.Serializer.deserializeLayer(serializedLayer);
          piskel.addLayer(layer);
        });
      } else {
        piskel = pskl.utils.Serializer.__backwardDeserializer(data);
      }

      return piskel;
    },

    deserializeLayer : function (json) {
      var lData = JSON.parse(json);
      var layer = new pskl.model.Layer(lData.name);

      lData.frames.forEach(function (serializedFrame) {
        var frame = pskl.utils.Serializer.deserializeFrame(serializedFrame);
        layer.addFrame(frame);
      });

      return layer;
    },

    deserializeFrame : function (json) {
      var framePixelGrid = JSON.parse(json);
      return pskl.model.Frame.fromPixelGrid(framePixelGrid);
    },

    /**
     * Deserialize old piskel framesheets. Initially piskels were stored as arrays of frames : "[[pixelGrid],[pixelGrid],[pixelGrid]]".
     */
    __backwardDeserializer : function (frames) {
      var layer = new pskl.model.Layer('Layer 1');
      frames.forEach(function (frame) {
        layer.addFrame(pskl.model.Frame.fromPixelGrid(frame));
      });
      var width = layer.getFrameAt(0).getWidth(), height = layer.getFrameAt(0).getHeight();
      var piskel = new pskl.model.Piskel(width, height);
      piskel.addLayer(layer);

      return piskel;
    }
  };
})();