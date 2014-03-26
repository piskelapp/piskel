(function () {
  var ns = $.namespace('pskl.controller');

  ns.PalettesListController = function () {

  };

  ns.PalettesListController.prototype.init = function () {
    this.paletteColorTemplate_ = pskl.utils.Template.get('palette-color-template');
    this.colorListContainer_ = document.querySelectorAll('.palettes-list')[0];
    this.colorPaletteSelect_ = document.querySelectorAll('.palette-picker')[0];

    this.colorPaletteSelect_.addEventListener('change', this.onPaletteSelected_.bind(this));
  };

  ns.PalettesListController.prototype.onPaletteSelected_ = function (evt) {
    var paletteId = this.colorPaletteSelect_.value;
    console.log('paletteId', paletteId);
    if (paletteId === '__manage-palettes') {
      console.log('DISPLAY DIALOG');
      $.publish(Events.DIALOG_DISPLAY, 'manage-palettes');
      this.colorPaletteSelect_.value= '__no-palette';
    }
  };
})();