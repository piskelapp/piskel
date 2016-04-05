(function () {
  var ns = $.namespace('pskl.controller.settings.exportimage');

  var BLACK = '#000000';

  ns.CExportController = function (piskelController) {
    this.piskelController = piskelController;
  };

  pskl.utils.inherit(ns.CExportController, pskl.controller.settings.AbstractSettingController);

  ns.CExportController.prototype.init = function () {

    var downloadButton = document.querySelector('.c-download-button');
    this.addEventListener(downloadButton, 'click', this.onCDownloadButtonClick_);
  };

  ns.CExportController.prototype.onCDownloadButtonClick_ = function (evt) {
    var fileName = this.getPiskelName_() + '.c';
    var cName = this.getPiskelName_().replace(" ","_");
    var outputCanvas = this.getFramesheetAsCanvas();
    var width = this.piskelController.getWidth();
    var height = this.piskelController.getHeight();
    
    // Create a background canvas that will be filled with the transparent color before each render.
    var background = pskl.utils.CanvasUtils.createCanvas(width, height);
    var context = background.getContext('2d');
    context.fillStyle = BLACK;

    // Useful defines for C routines
    var frameStr = '#include <stdint.h>\n\n';
    frameStr += '#define '+ cName.toUpperCase() + '_FRAME_COUNT ' +  this.piskelController.getFrameCount() + '\n';
    frameStr += '#define '+ cName.toUpperCase() + '_WIDTH ' + width + '\n';
    frameStr += '#define '+ cName.toUpperCase() + '_HEIGHT ' + height + '\n\n';

    frameStr += '/* Piskel \"' + this.getPiskelName_() + '\" */\n\n';

    frameStr += 'uint32_t ' + this.getPiskelName_().toLowerCase();
    frameStr += '_data[' + this.piskelController.getFrameCount() + '][' + width * height + '] = {\n';
   
    for (var i = 0 ; i < this.piskelController.getFrameCount() ; i++) {
      var render = this.piskelController.renderFrameAt(i, true);
      context.clearRect(0, 0, width, height);
      context.fillRect(0, 0, width, height);
      context.drawImage(render, 0, 0, width, height);
      var imgd = context.getImageData(0, 0, width, height);
      var pix = imgd.data;

      frameStr += '{\n';
      for (var i = 0; i < pix.length; i += 4) {
	frameStr += this.rgbToCUint(pix[i], pix[i+1], pix[i+2]);
	if (i != pix.length - 4)
	  frameStr += ', ';
	if (i % (width * 4) == 0)
	  frameStr += '\n';
      }
      frameStr += '\n}';
      
    }
    
    frameStr += '};'
    pskl.utils.BlobUtils.stringToBlob(frameStr, function(blob) {
      pskl.utils.FileUtils.downloadAsFile(blob, fileName);
    }.bind(this), 'application/text');
 
  };

  ns.CExportController.prototype.getPiskelName_ = function () {
    return this.piskelController.getPiskel().getDescriptor().name;
  };

  ns.CExportController.prototype.rgbToCUint = function (r, g, b) {
    return '0x' + r.toString(16).slice(-2) + g.toString(16).slice(-2) + b.toString(16).slice(-2);
  };

  ns.CExportController.prototype.getFramesheetAsCanvas = function () {
    var renderer = new pskl.rendering.PiskelRenderer(this.piskelController);
    return renderer.renderAsCanvas();
  };

})();
