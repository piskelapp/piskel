(function () {
  var ns = $.namespace('pskl.utils');

  ns.PiskelFileUtils = {
    /**
     * Load a piskel from a piskel file.
     * After deserialization is successful, the provided success callback will be called.
     * Success callback is expected to handle 3 arguments : (piskel:Piskel, descriptor:PiskelDescriptor, fps:Number)
     * @param  {File} file the .piskel file to load
     * @param  {Function} onSuccess Called if the deserialization of the piskel is successful
     * @param  {Function} onError NOT USED YET
     */
    loadFromFile : function (file, onSuccess, onError) {
      pskl.utils.FileUtils.readFile(file, function (content) {
        var rawPiskel = pskl.utils.Base64.toText(content);
        ns.PiskelFileUtils.decodePiskelFile(
          rawPiskel,
          function (piskel, descriptor, fps) {
            // if using Node-Webkit, store the savePath on load
            // Note: the 'path' property is unique to Node-Webkit, and holds the full path
            if (pskl.utils.Environment.detectNodeWebkit()) {
              piskel.savePath = file.path;
            }
            onSuccess(piskel, descriptor, fps);
          },
          onError
        );
      });
    },

    decodePiskelFile : function (rawPiskel, onSuccess, onError) {
      var serializedPiskel = JSON.parse(rawPiskel);
      var fps = serializedPiskel.piskel.fps;
      var descriptor = new pskl.model.piskel.Descriptor(serializedPiskel.piskel.name, serializedPiskel.piskel.description, true);
      pskl.utils.serialization.Deserializer.deserialize(serializedPiskel, function (piskel) {
        onSuccess(piskel, descriptor, fps);
      });
    }

  };
})();