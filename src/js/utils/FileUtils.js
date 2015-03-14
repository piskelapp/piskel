(function () {
  var ns = $.namespace('pskl.utils');

  var stopPropagation = function (e) {
    e.stopPropagation();
  };

  ns.FileUtils = {
    readFile : function (file, callback) {
      var reader = new FileReader();
      reader.onload = function(event){
        callback(event.target.result);
      };
      reader.readAsDataURL(file);
    },

    readImageFile : function (file, callback) {
      ns.FileUtils.readFile(file, function (content) {
        var image = new Image();
        image.onload = callback.bind(null, image);
        image.src = content;
      });
    },

    downloadAsFile : function (content, filename) {
      var saveAs = window.saveAs || (navigator.msSaveBlob && navigator.msSaveBlob.bind(navigator));
      if (saveAs) {
        saveAs(content, filename);
      } else {
        var downloadLink = document.createElement('a');
        content = window.URL.createObjectURL(content);
        downloadLink.setAttribute('href', content);
        downloadLink.setAttribute('download', filename);
        document.body.appendChild(downloadLink);
        downloadLink.addEventListener('click', stopPropagation);
        downloadLink.click();
        downloadLink.removeEventListener('click', stopPropagation);
        document.body.removeChild(downloadLink);
      }
    },

    /**
     *
     * @param content
     * @param defaultFileName
     * @param callback
     */
    desktopSaveAs: function (content, defaultFileName, callback) {
      // NodeWebkit has no js api for opening the save dialog.
      // Instead, it adds two new attributes to the anchor tag: nwdirectory and nwsaveas
      // (see: https://github.com/nwjs/nw.js/wiki/File-dialogs )
      defaultFileName = defaultFileName || "";
      var tagString = '<input type="file" nwsaveas="'+ defaultFileName +'" nwworkingdir=""/>';
      var $chooser = $(tagString);
      $chooser.change(function(e) {
        var filename =  $(this).val();
        pskl.utils.FileUtils.desktopSaveToFile(content, filename, function(){
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
    desktopSaveToFile: function(content, filename, callback) {
      var fs = require('fs');
      //var arrayBuffer = ns.FileUtils.toArrayBuffer(content);
      fs.writeFile(filename, content, function(err){
        if (err) {
          //throw err;
          console.log('destopSavetoFile() - error saving file', filename, 'Error:', err);
        }
        callback();
      });
    }

  };
})();
