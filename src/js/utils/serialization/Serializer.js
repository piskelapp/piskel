(function () {
  var ns = $.namespace('pskl.utils.serialization');

  var areChunksValid = function (chunks) {
    return chunks.length && chunks.every(function (chunk) {
      return chunk.base64PNG;
    });
  };

  var createLineLayout = function (size, offset) {
    var layout = [];
    for (var i = 0 ; i < size ; i++) {
      layout.push([i + offset]);
    }

    return layout;
  };

  ns.Serializer = {
    serialize : function (piskel) {
      var serializedLayers = piskel.getLayers().map(function (l) {
        return pskl.utils.serialization.Serializer.serializeLayer(l);
      });
      return JSON.stringify({
        modelVersion : Constants.MODEL_VERSION,
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

      // A layer spritesheet data can be chunked in case the spritesheet PNG is to big to be
      // converted to a dataURL.
      // Frames are divided equally amongst chunks and each chunk is converted to a spritesheet
      // PNG. If any chunk contains an invalid base64 PNG, we increase the number of chunks and
      // retry.
      var chunks = [];
      while (!areChunksValid(chunks)) {
        if (chunks.length > frames.length) {
          // Something went horribly wrong.
          chunks = [];
          break;
        }

        // Chunks are invalid, increase the number of chunks by one, and chunk the frames array.
        var frameChunks = pskl.utils.Array.chunk(frames, chunks.length + 1);

        // Reset chunks array.
        chunks = [];

        // After each chunk update the offset by te number of frames that have been processed.
        var offset = 0;
        for (var i = 0 ; i < frameChunks.length ; i++) {
          var chunkFrames = frameChunks[i];
          var renderer = new pskl.rendering.FramesheetRenderer(chunkFrames);
          chunks.push({
            base64PNG : renderer.renderAsCanvas().toDataURL(),
            // create a layout array, containing the indices of the frames extracted in this chunk
            layout : createLineLayout(chunkFrames.length, offset),
          });

          offset += chunkFrames.length;
        }
      }

      layerToSerialize.chunks = chunks;
      return JSON.stringify(layerToSerialize);
    }
  };
})();
