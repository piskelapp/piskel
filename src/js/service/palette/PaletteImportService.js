(function () {
  var ns = $.namespace('pskl.service.palette');

  var fileReaders = {
    'gpl' : ns.PaletteGplReader,
    'txt' : ns.PaletteTxtReader
  };

  ns.PaletteImportService = function () {};

  ns.PaletteImportService.prototype.read = function (file, onSuccess, onError) {
    var reader = this.getReader_(file, onSuccess, onError);
    if (reader) {
      reader.read();
    } else {
      throw 'Could not find reader for file : ' + file.name;
    }
  };

  ns.PaletteImportService.prototype.isImage_ = function (file) {
    return file.type.indexOf('image') === 0;
  };

  ns.PaletteImportService.prototype.getReader_ = function (file, onSuccess, onError) {
    var readerClass = this.getReaderClass_(file);
    if (readerClass) {
      return new readerClass(file, onSuccess, onError);
    } else {
      return null;
    }
  };

  ns.PaletteImportService.prototype.getReaderClass_ = function (file) {
    var readerClass;
    if (this.isImage_(file)) {
      readerClass = ns.PaletteImageReader;
    } else {
      var extension = this.getExtension_(file);
      readerClass = fileReaders[extension];
    }
    return readerClass;
  };

  ns.PaletteImportService.prototype.getExtension_ = function (file) {
    var parts = file.name.split('.');
    var extension = parts[parts.length-1];
    return extension.toLowerCase();
  };
})();