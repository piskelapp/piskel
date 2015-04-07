(function () {
  var ns = $.namespace('pskl.utils');

  var stopPropagation = function (e) {
    e.stopPropagation();
  };

  ns.FileUtilsDesktop = {

    chooseFileDialog: function (callback) {
      var tagString = '<input type="file" nwworkingdir=""/>';
      var $chooser = $(tagString);
      $chooser.change(function(e) {
        var filename = $(this).val();
        callback(filename);
      });
      $chooser.trigger('click');
    },

    /**
     *
     * @param content
     * @param defaultFileName - file name to pre-populate the dialog
     * @param extension - if supplied, the selected extension will guaranteed to be on the filename -
     * NOTE: there is a possible danger here... If the extension is added to a fileName, but there
     * is already another file of the same name *with* the extension, it will get overwritten.
     * @param callback
     */
    saveAs: function (content, defaultFileName, extension, callback) {
      // NodeWebkit has no js api for opening the save dialog.
      // Instead, it adds two new attributes to the anchor tag: nwdirectory and nwsaveas
      // (see: https://github.com/nwjs/nw.js/wiki/File-dialogs )
      defaultFileName = defaultFileName || "";
      var tagString = '<input type="file" nwsaveas="'+ defaultFileName +'" nwworkingdir=""/>';
      var $chooser = $(tagString);
      $chooser.change(function(e) {
        var filename = $(this).val();
        if (typeof extension == 'string') {
          if (extension[0] !== '.') {
            extension = "." + extension;
          }
          var hasExtension = (filename.substring(filename.length - extension.length) === extension);
          if (!hasExtension) {
            filename += extension;
          }
        }
        pskl.utils.FileUtilsDesktop.saveToFile(content, filename, function(){
          callback(filename);
        });
      });
      $chooser.trigger('click');
    },

    /**
     * Save data directly to disk, without showing a save dialog
     * Requires Node-Webkit environment for file system access
     * @param content - data to be saved
     * @param {string} filename - fill path to the file
     * @callback callback
     */
    saveToFile : function(content, filename, callback) {
      var fs = window.require('fs');
      fs.writeFile(filename, content, function(err){
        if (err) {
          //throw err;
          console.log('FileUtilsDesktop::savetoFile() - error saving file:', filename, 'Error:', err);
        }
        callback();
      });
    },

    readFile : function(filename, callback) {
      var fs = window.require('fs');
      // NOTE: currently loading everything as utf8, which may not be desirable in future
      fs.readFile(filename, 'utf8', function(err, data){
        if (err) {
          console.log('FileUtilsDesktop::readFile() - error reading file:', filename, 'Error:', err);
        }
        callback(data);
      });
    }
  };
})();
