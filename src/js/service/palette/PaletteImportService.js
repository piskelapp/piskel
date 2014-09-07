(function () {
  var ns = $.namespace('pskl.service.palette');

  var supportedFileFormats = ['gpl'];

  ns.PaletteImportService = function () {};

  ns.PaletteImportService.prototype.read = function (file, onSuccess, onError) {
    var reader;
    if (this.isImage_(file)){
      reader = new ns.PaletteImageReader(file, onSuccess, onError);
    } else if (this.isSupportedFormat_(file)) {
      reader = this.getFileReader_(file, onSuccess, onError);
    }

    if (reader) {
      reader.read();
    } else {
      throw 'Could not find reader for file : ' + file.name;
    }
  };

  ns.PaletteImportService.prototype.isImage_ = function (file) {
    return file.type.indexOf('image') === 0;
  };

  ns.PaletteImportService.prototype.getFileReader_ = function (file, onSuccess, onError) {
    var extension = this.getExtension_(file);
    if (extension === 'gpl') {
      return new ns.PaletteGplReader(file, onSuccess, onError);
    }
  };

  ns.PaletteImportService.prototype.isSupportedFormat_ = function (file) {
    var extension = this.getExtension_(file);
    return supportedFileFormats.indexOf(extension) != -1;
  };

  ns.PaletteImportService.prototype.getExtension_ = function (file) {
    var parts = file.name.split('.');
    return parts[parts.length-1];
  };
})();