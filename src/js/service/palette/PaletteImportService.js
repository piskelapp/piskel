(function () {
  var ns = $.namespace('pskl.service.palette');

  var fileReaders = {
    'gpl' : ns.reader.PaletteGplReader,
    'pal' : ns.reader.PalettePalReader,
    'txt' : ns.reader.PaletteTxtReader,
    'img' : ns.reader.PaletteImageReader
  };

  ns.PaletteImportService = function () {};
  ns.PaletteImportService.prototype.init = function () {};

  ns.PaletteImportService.prototype.read = function (file, onSuccess, onError) {
    var reader = this.getReader_(file, onSuccess, onError);
    if (reader) {
      reader.read();
    } else {
      console.error('Could not find reader for file : %s', file.name);
    }
  };

  ns.PaletteImportService.prototype.isImage_ = function (file) {
    return file.type.indexOf('image') === 0;
  };

  ns.PaletteImportService.prototype.getReader_ = function (file, onSuccess, onError) {
    var ReaderClass = this.getReaderClass_(file);
    if (ReaderClass) {
      return new ReaderClass(file, onSuccess, onError);
    } else {
      return null;
    }
  };

  ns.PaletteImportService.prototype.getReaderClass_ = function (file) {
    var ReaderClass;
    if (this.isImage_(file)) {
      ReaderClass = fileReaders.img;
    } else {
      var extension = this.getExtension_(file);
      ReaderClass = fileReaders[extension];
    }
    return ReaderClass;
  };

  ns.PaletteImportService.prototype.getExtension_ = function (file) {
    var parts = file.name.split('.');
    var extension = parts[parts.length - 1];
    return extension.toLowerCase();
  };
})();
