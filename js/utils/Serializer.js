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

    deserializePiskel : function (piskelString) {
      var data = JSON.parse(piskelString);
      return this.createPiskel(data);
    },

    /**
     * Similar to deserializePiskel, but dealing directly with a parsed piskel
     * @param  {Object} data JSON.parse of a serialized piskel
     * @return {pskl.model.Piskel} a piskel
     */
    createPiskel : function (data) {
      var piskel = null;
      if (data.modelVersion == Constants.MODEL_VERSION) {
        var piskelData = data.piskel;
        piskel = new pskl.model.Piskel(piskelData.width, piskelData.height);
        layersToLoad = piskelData.layers;
        piskelData.layers.forEach(function (serializedLayer) {
          var layer = pskl.utils.Serializer.deserializeLayer(serializedLayer);
          piskel.addLayer(layer);
        });
      } else if (data.modelVersion == 1) {
        throw 'No backward compatible adapter for modelVersion 1';
      } else {
        piskel = pskl.utils.Serializer.backwardDeserializer_(data);
      }

      return piskel;
    },

    deserializeLayer : function (layerString) {
      var layerData = JSON.parse(layerString);
      var layer = new pskl.model.Layer(layerData.name);
      // TODO : nasty trick to keep the whole loading process lazily synchronous
      // 1 - adding a fake frame so that the rendering can start
      layer.addFrame(new pskl.model.Frame(32,32));

      // 2 - create an image to load the base64PNG representing the layer
      var base64PNG = layerData.base64PNG;
      var image = new Image();

      // 3 - attach the onload callback that will be triggered asynchronously
      image.onload = function () {
        // 6 - remove the fake frame
        layer.removeFrameAt(0);

        // 7 - extract the frames from the loaded image
        var frames = pskl.utils.LayerUtils.createFromImage(image, layerData.frameCount);

        // 8 - add each image to the layer
        frames.forEach(function (frame) {
          layer.addFrame(pskl.model.Frame.fromPixelGrid(frame));
        });
      };

      // 4 - set the source of the image
      image.src = base64PNG;

      // 5 - return a pointer to the new layer instance, which at this point contains a fake frame
      return layer;
    },

    deserializeLayer_v1 : function (layerString) {
      var layerData = JSON.parse(layerString);
      var layer = new pskl.model.Layer(layerData.name);
      layerData.frames.forEach(function (serializedFrame) {
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
