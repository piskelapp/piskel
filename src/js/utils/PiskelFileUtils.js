(function () {
  var ns = $.namespace('pskl.utils');

  ns.PiskelFileUtils = {
    loadFromFile : function (file, onSuccess, onError) {
      pskl.utils.FileUtils.readFile(file, function (content) {
        var rawPiskel = window.atob(content.replace('data:;base64,',''));
        var serializedPiskel = JSON.parse(rawPiskel);
        var fps = serializedPiskel.piskel.fps;
        var descriptor = new pskl.model.piskel.Descriptor(serializedPiskel.piskel.name, serializedPiskel.piskel.description, true);
        pskl.utils.serialization.Deserializer.deserialize(serializedPiskel, function (piskel) {
          onSuccess(piskel, descriptor, fps);
        });
      });
    }
  };
})();