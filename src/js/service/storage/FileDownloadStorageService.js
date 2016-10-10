(function () {
  var ns = $.namespace('pskl.service.storage');

  ns.FileDownloadStorageService = function () {};
  ns.FileDownloadStorageService.prototype.init = function () {};

  ns.FileDownloadStorageService.prototype.save = function (piskel) {
    var serialized = pskl.utils.Serializer.serializePiskel(piskel);
    var deferred = Q.defer();

    var piskelName = piskel.getDescriptor().name;
    var timestamp = pskl.utils.DateUtils.format(new Date(), '{{Y}}{{M}}{{D}}-{{H}}{{m}}{{s}}');
    var fileName = piskelName + '-' + timestamp + '.piskel';

    try {
      pskl.utils.FileUtils.downloadAsFile(new Blob([serialized], {type : 'application/piskel+json'}), fileName);
      deferred.resolve();
    } catch (e) {
      deferred.reject(e.message);
    }

    return deferred.promise;
  };

})();
