(function () {
  var ns = $.namespace('pskl.utils');

  var layersToLoad = 0;

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
      var frames = layer.getFrames();
      var renderer = new pskl.rendering.FramesheetRenderer(frames);
      var base64PNG = renderer.renderAsCanvas().toDataURL();

      return JSON.stringify({
        name : layer.getName(),
        base64PNG : base64PNG,
        frameCount : frames.length
      });
    },

    backwardDeserializer_v1 : function (data) {
      var piskelData = data.piskel;
      var piskel = new pskl.model.Piskel(piskelData.width, piskelData.height);

      piskelData.layers.forEach(function (serializedLayer) {
        var layer = pskl.utils.Serializer.deserializeLayer_v1(serializedLayer);
        piskel.addLayer(layer);
      });

      return piskel;
    },

    deserializeLayer_v1 : function (layerString) {
      var layerData = JSON.parse(layerString);
      var layer = new pskl.model.Layer(layerData.name);
      layerData.frames.forEach(function (serializedFrame) {
        var frame = pskl.utils.Serializer.deserializeFrame_v1(serializedFrame);
        layer.addFrame(frame);
      });

      return layer;
    },

    deserializeFrame_v1 : function (frameString) {
      var framePixelGrid = JSON.parse(frameString);
      return pskl.model.Frame.fromPixelGrid(framePixelGrid);
    },

    /**
     * Deserialize old piskel framesheets. Initially piskels were stored as arrays of pixelGrids : "[[pixelGrid],[pixelGrid],[pixelGrid]]".
     */
    backwardDeserializer_ : function (pixelGrids) {
      var frames = pixelGrids.map(function (grid) {
        return pskl.model.Frame.fromPixelGrid(grid);
      });
      var layer = pskl.model.Layer.fromFrames('Layer 1', frames);
      return pskl.model.Piskel.fromLayers([layer]);
    }
  };
})();
