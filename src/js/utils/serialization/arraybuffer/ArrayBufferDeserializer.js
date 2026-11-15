(function () {
  var ns = $.namespace("pskl.utils.serialization.arraybuffer");

  /**
   * The array buffer serialization-deserialization should only be used when backing
   * up the animation in memory. If you actually need to dump the animation to a
   * string use the regular serialization helpers.
   *
   * Reads back the raw-pixel format written by ArrayBufferSerializer. No canvas is
   * involved, so restoring a history snapshot never depends on a canvas readback
   * (which Firefox / LibreWolf may perturb for fingerprinting protection).
   * See https://github.com/piskelapp/piskel/issues/1294
   *
   * The callback is invoked synchronously with the deserialized pskl.model.Piskel.
   */
  ns.ArrayBufferDeserializer = {
    deserialize: function (data, callback) {
      var i;
      var j;
      var buffer = data;
      var uint16 = new Uint16Array(buffer);
      var uint32 = new Uint32Array(buffer);

      /********/
      /* META */
      /********/
      var index = 0;
      index++; // skip model version (in-memory format, no cross-version compat)
      var width = uint16[index++];
      var height = uint16[index++];
      var fps = uint16[index++];
      var descriptorNameLength = uint16[index++];
      var descriptorDescriptionLength = uint16[index++];
      var layerCount = uint16[index++];
      var serializedHiddenFramesLength = uint16[index++];

      /******************/
      /* DESCRIPTOR DATA */
      /******************/
      var descriptorName = "";
      for (i = 0; i < descriptorNameLength; i++) {
        descriptorName += String.fromCharCode(uint16[index++]);
      }

      var descriptorDescription = "";
      for (i = 0; i < descriptorDescriptionLength; i++) {
        descriptorDescription += String.fromCharCode(uint16[index++]);
      }

      var serializedHiddenFrames = "";
      for (i = 0; i < serializedHiddenFramesLength; i++) {
        serializedHiddenFrames += String.fromCharCode(uint16[index++]);
      }
      // Frame indices are stored as numbers (see PiskelController, which compares
      // them with indexOf on numeric indices).
      var hiddenFrames = serializedHiddenFrames
        ? serializedHiddenFrames.split("-").map(Number)
        : [];

      /***************/
      /* LAYERS META */
      /***************/
      var layersMeta = [];
      var frameCount = 0;
      for (i = 0; i < layerCount; i++) {
        var layerNameLength = uint16[index++];
        var layerName = "";
        for (j = 0; j < layerNameLength; j++) {
          layerName += String.fromCharCode(uint16[index++]);
        }
        var opacity = uint16[index++] / 65535;
        frameCount = uint16[index++];
        layersMeta.push({ name: layerName, opacity: opacity });
      }

      /***************/
      /* LAYERS DATA */
      /***************/
      // index is the number of Uint16 read so far. The pixel region starts at the
      // first 4-byte aligned offset at or after that (see the serializer).
      var framePixelCount = width * height;
      var pixelIndex = (index + 1) >> 1;

      var descriptor = new pskl.model.piskel.Descriptor(
        descriptorName,
        descriptorDescription
      );
      var piskel = new pskl.model.Piskel(width, height, fps, descriptor);
      piskel.hiddenFrames = hiddenFrames;

      for (i = 0; i < layerCount; i++) {
        var meta = layersMeta[i];
        var layer = new pskl.model.Layer(meta.name);
        layer.setOpacity(meta.opacity);

        for (j = 0; j < frameCount; j++) {
          var pixelData = uint32.subarray(
            pixelIndex,
            pixelIndex + framePixelCount
          );
          pixelIndex += framePixelCount;

          var frame = new pskl.model.Frame(width, height);
          frame.setPixels(pixelData);
          layer.addFrame(frame);
        }

        piskel.addLayer(layer);
      }

      callback(piskel);
    }
  };
})();
