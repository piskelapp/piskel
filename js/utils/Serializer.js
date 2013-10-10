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

    deserializePiskel : function (piskelString) {
      var piskelData = JSON.parse(piskelString);
      return this.createPiskelFromData(piskelData);
    },

    /**
     * Similar to deserializePiskel, but dealing directly with a parsed piskel
     * @param  {Object} piskelData JSON.parse of a serialized piskel
     * @return {pskl.model.Piskel} a piskel
     */
    createPiskel : function (piskelData) {
      var piskel = null;
      if (piskelData.modelVersion == Constants.MODEL_VERSION) {
        var pData = piskelData.piskel;
        piskel = new pskl.model.Piskel(pData.width, pData.height);

        pData.layers.forEach(function (serializedLayer) {
          var layer = pskl.utils.Serializer.deserializeLayer(serializedLayer);
          piskel.addLayer(layer);
        });
      } else {
        piskel = pskl.utils.Serializer.backwardDeserializer_(piskelData);
      }

      return piskel;
    },

    deserializeLayer : function (layerString) {
      var lData = JSON.parse(layerString);
      var layer = new pskl.model.Layer(lData.name);

      lData.frames.forEach(function (serializedFrame) {
        var frame = pskl.utils.Serializer.deserializeFrame(serializedFrame);
        layer.addFrame(frame);
      });

      return layer;
    },

    deserializeFrame : function (frameString) {
      var framePixelGrid = JSON.parse(frameString);
      return pskl.model.Frame.fromPixelGrid(framePixelGrid);
    },

    /**
     * Deserialize old piskel framesheets. Initially piskels were stored as arrays of frames : "[[pixelGrid],[pixelGrid],[pixelGrid]]".
     */
    backwardDeserializer_ : function (frames) {
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
