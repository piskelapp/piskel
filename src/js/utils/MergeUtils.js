(function () {
  var ns = $.namespace('pskl.utils');

  ns.MergeUtils = {
    /**
     * Merge two piskel instances in a new piskel instance
     * @param  {Piskel} piskel
     *         The original piskel (name and description will be preserved)
     * @param  {Piskel} importedPiskel
     *         The imported piskel
     * @param  {Object} options
     *         - index: {Number} index where the new frames should be appended
     *         - resize: {String} either "expand" or "keep"
     *         - origin: {String} can be any of the existing AnchorWidget origins.
     *         - insertMode: {String} either "insert" or "add"
     *
     * @return {Piskel} The new Piskel instance created
     */
    merge : function (piskel, importedPiskel, options) {
      var isImportedPiskelBigger =
          importedPiskel.getWidth() > piskel.getWidth() ||
          importedPiskel.getHeight() > piskel.getHeight();

      // First make sure both the piskel and the imported piskel use the target dimensions.
      if (isImportedPiskelBigger && options.resize === 'expand') {
        piskel = pskl.utils.ResizeUtils.resizePiskel(piskel, {
          width : Math.max(piskel.getWidth(), importedPiskel.getWidth()),
          height : Math.max(piskel.getHeight(), importedPiskel.getHeight()),
          origin : options.origin,
          resizeContent: false
        });
      } else {
        importedPiskel = pskl.utils.ResizeUtils.resizePiskel(importedPiskel, {
          width : piskel.getWidth(),
          height : piskel.getHeight(),
          origin : options.origin,
          resizeContent: false
        });
      }

      var insertIndex = options.insertIndex;
      if (options.insertMode === 'insert') {
        // The index provided by the frame picker is 1-based.
        // When adding new frames, this works out fine, but if we want to
        // insert the new content in existing frames, we need to get the real
        // 0-based index of the selected frame.
        insertIndex = insertIndex - 1;
      }
      // Add necessary frames in the original piskel.
      var importedFrameCount = importedPiskel.getFrameCount();
      for (var i = 0 ; i < importedFrameCount ; i++) {
        var index = i + insertIndex;
        // For a given index, a new frame should be added either if we are using "add" insert mode
        // or if the current index is not supported by the original piskel.
        if (options.insertMode === 'add' || index >= piskel.getFrameCount()) {
          ns.MergeUtils.addFrameToLayers_(piskel, index);
        }
      }

      // Import the layers in the original piskel.
      importedPiskel.getLayers().forEach(function (layer) {
        var name = layer.getName() + ' (imported)';
        var importedLayer = new pskl.model.Layer(name);
        for (var i = 0 ; i < piskel.getFrameCount() ; i++) {
          var importedIndex = i - insertIndex;
          var frame = layer.getFrameAt(importedIndex);
          if (!frame) {
            frame = ns.MergeUtils.createEmptyFrame_(piskel);
          }

          importedLayer.addFrame(frame);
        }
        piskel.addLayer(importedLayer);
      });

      return piskel;
    },

    createEmptyFrame_ : function (piskel) {
      return new pskl.model.Frame(piskel.getWidth(), piskel.getHeight());
    },

    addFrameToLayers_ : function (piskel, index) {
      piskel.getLayers().forEach(function (l) {
        l.addFrameAt(ns.MergeUtils.createEmptyFrame_(piskel), index);
      });
    }
  };
})();
