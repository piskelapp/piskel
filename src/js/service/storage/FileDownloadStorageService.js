(function () {
  var ns = $.namespace("pskl.service.storage");

  ns.FileDownloadStorageService = function () {};
  ns.FileDownloadStorageService.prototype.init = function () {};

  ns.FileDownloadStorageService.prototype.save = function (piskel) {
    var serialized = pskl.utils.serialization.Serializer.serialize(piskel);

    return new Promise(
      function (resolve, reject) {
        pskl.utils.BlobUtils.stringToBlob(
          serialized,
          function (blob) {
            var piskelName = piskel.getDescriptor().name;
            var timestamp = pskl.utils.DateUtils.format(
              new Date(),
              "{{Y}}{{M}}{{D}}-{{H}}{{m}}{{s}}"
            );
            var fileName = piskelName + "-" + timestamp + ".piskel";

            try {
              pskl.utils.FileUtils.downloadAsFile(blob, fileName);
              resolve();
            } catch (e) {
              reject(e.message);
            }
          }.bind(this),
          "application/piskel+json"
        );
      }.bind(this)
    );
  };
})();
