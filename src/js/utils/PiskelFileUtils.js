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
      pskl.utils.FileUtils.readFileAsArrayBuffer(file, function (content) {
        ns.PiskelFileUtils.decodePiskelFile(
          content,
          function (piskel, extra) {
            // if using Node-Webkit, store the savePath on load
            // Note: the 'path' property is unique to Node-Webkit, and holds the full path
            if (pskl.utils.Environment.detectNodeWebkit()) {
              piskel.savePath = file.path;
            }
            onSuccess(piskel, extra);
          },
          onError
        );
      });
    },

    decodePiskelFile : function (serializedPiskel, onSuccess, onError) {
      pskl.utils.serialization.Deserializer.deserialize(serializedPiskel, function (piskel, extra) {
        onSuccess(piskel, extra);
      });
    }

  };
})();
