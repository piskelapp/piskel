(function () {
  var ns = $.namespace("pskl.utils.serialization.arraybuffer");

  /**
   * The array buffer serialization-deserialization should only be used when backing
   * up the animation in memory. If you actually need to dump the animation to a
   * string use the regular serialization helpers.
   *
   * The in-memory format stores the raw frame pixels (not a PNG snapshot), so a
   * history round-trip never reads pixels back from a canvas. It is therefore
   * immune to browsers that perturb canvas readbacks (getImageData/toDataURL) for
   * fingerprinting protection, e.g. Firefox / LibreWolf with
   * privacy.resistFingerprinting, which used to corrupt snapshot-based undo/redo.
   * See https://github.com/piskelapp/piskel/issues/1294
   *
   *********
   *  META  *
   *********
   * Each meta entry is one Uint16.
   * [0] = model version
   * [1] = width
   * [2] = height
   * [3] = fps
   * [4] = descriptor name length
   * [5] = descriptor description length
   * [6] = layers count
   * [7] = hidden frames list length (number of characters, joined with "-")
   *
   * // Descriptor data (Uint16 characters)
   * [8 .. 8+nameLen-1]                     = descriptor name
   * [8+nameLen .. 8+nameLen+descLen-1]     = descriptor description
   * [8+nameLen+descLen .. +hiddenLen-1]    = hidden frames list
   *
   * // Layers meta (Uint16, repeated per layer)
   * layer name length
   * layer name characters
   * layer opacity (0..65535)
   * layer frame count
   *
   * // Layers data : raw pixels, one Uint32 per sprite pixel, byte-identical to
   * // pskl.model.Frame#pixels. The region is 4-byte aligned.
   * [layerCount * frameCount * width * height] Uint32s = pixels of every frame of every layer
   */
  ns.ArrayBufferSerializer = {
    calculateRequiredBytes: function (piskel, width, height) {
      var layers = piskel.getLayers();
      var descriptorNameLength = piskel.getDescriptor().name.length;
      var descriptorDescriptionLength =
        piskel.getDescriptor().description.length;
      var serializedHiddenFrames = piskel.hiddenFrames.join("-");

      // 8 meta words + descriptor name/description + hidden frames list.
      var wordCount =
        8 +
        descriptorNameLength +
        descriptorDescriptionLength +
        serializedHiddenFrames.length;

      // Per layer: name length + name characters + opacity + frame count.
      for (var i = 0; i < layers.length; i++) {
        wordCount += 3 + layers[i].getName().length;
      }

      // All layers are synchronized (same number of frames), so the pixel region
      // size derives from the first layer frame count.
      var frameCount = layers[0].getFrames().length;

      var uint16Bytes = wordCount * 2;
      // The pixel region must be 4-byte aligned.
      var padding = (4 - (uint16Bytes % 4)) % 4;
      var pixelBytes = layers.length * frameCount * width * height * 4;

      return uint16Bytes + padding + pixelBytes;
    },

    serialize: function (piskel) {
      var i;
      var j;
      var width = piskel.getWidth();
      var height = piskel.getHeight();
      var layers = piskel.getLayers();
      var descriptorName = piskel.getDescriptor().name;
      var descriptorDescription = piskel.getDescriptor().description;
      var serializedHiddenFrames = piskel.hiddenFrames.join("-");

      var bytes = ns.ArrayBufferSerializer.calculateRequiredBytes(
        piskel,
        width,
        height
      );
      var buffer = new ArrayBuffer(bytes);
      var uint16 = new Uint16Array(buffer);
      var uint32 = new Uint32Array(buffer);

      var index = 0;

      /********/
      /* META */
      /********/
      uint16[index++] = Constants.MODEL_VERSION;
      uint16[index++] = width;
      uint16[index++] = height;
      uint16[index++] = piskel.getFPS();
      uint16[index++] = descriptorName.length;
      uint16[index++] = descriptorDescription.length;
      uint16[index++] = layers.length;
      uint16[index++] = serializedHiddenFrames.length;

      /******************/
      /* DESCRIPTOR DATA */
      /******************/
      for (i = 0; i < descriptorName.length; i++) {
        uint16[index++] = descriptorName.charCodeAt(i);
      }
      for (i = 0; i < descriptorDescription.length; i++) {
        uint16[index++] = descriptorDescription.charCodeAt(i);
      }
      for (i = 0; i < serializedHiddenFrames.length; i++) {
        uint16[index++] = serializedHiddenFrames.charCodeAt(i);
      }

      /***************/
      /* LAYERS META */
      /***************/
      for (i = 0; i < layers.length; i++) {
        var layerName = layers[i].getName();
        var opacity = layers[i].getOpacity();
        var frameCount = layers[i].getFrames().length;

        uint16[index++] = layerName.length;
        for (j = 0; j < layerName.length; j++) {
          uint16[index++] = layerName.charCodeAt(j);
        }
        uint16[index++] = Math.round(opacity * 65535);
        uint16[index++] = frameCount;
      }

      /***************/
      /* LAYERS DATA */
      /***************/
      // index is the number of Uint16 written so far. The pixel region starts at
      // the first 4-byte aligned offset at or after that, i.e. the nearest whole
      // number of Uint32 words. Round by adding 1 then halving.
      var framePixelCount = width * height;
      var pixelIndex = (index + 1) >> 1;

      for (i = 0; i < layers.length; i++) {
        var frames = layers[i].getFrames();
        for (j = 0; j < frames.length; j++) {
          uint32.set(frames[j].pixels, pixelIndex);
          pixelIndex += framePixelCount;
        }
      }

      return buffer;
    }
  };
})();
