(function () {
  var ns = $.namespace('pskl.service.palette');

  ns.PaletteImportService = function () {};

  ns.PaletteImportService.prototype.read = function (file, onSuccess, onError) {
    if (this.isImage_(file)){
      var reader = new ns.PaletteImageReader(file, onSuccess, onError);
      reader.read();
    } else if (this.isSupportedFormat_(file)) {
      this.importFile(file);
    }
  };

  ns.PaletteImportService.prototype.importFile = function (file) {

  };

  ns.PaletteImportService.prototype.isImage_ = function (file) {
    return file.type.indexOf('image') === 0;
  };

  ns.PaletteImportService.prototype.isSupportedFormat_ = function (file) {
    return (/\.piskel$/).test(file.name);
  };
})();