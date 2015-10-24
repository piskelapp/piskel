(function () {
  var ns = $.namespace('pskl.utils');

  var getFileInputElement = function (nwsaveas, accept) {
    var fileInputElement = document.createElement('INPUT');
    fileInputElement.setAttribute('type', 'file');
    fileInputElement.setAttribute('nwworkingdir', '');
    if (nwsaveas) {
      fileInputElement.setAttribute('nwsaveas', nwsaveas);
    }
    if (accept) {
      fileInputElement.setAttribute('accept', accept);
    }

    return fileInputElement;
  };

  ns.FileUtilsDesktop = {
    chooseFilenameDialog : function (nwsaveas, accept) {
      var deferred = Q.defer();
      var fileInputElement = getFileInputElement(nwsaveas, accept);
      var changeListener = function (evt) {
        fileInputElement.removeEventListener('change', changeListener);
        document.removeEventListener('click', changeListener);
        deferred.resolve(fileInputElement.value);
      };

      // fix for issue #322 :
      window.setTimeout(function () {
        fileInputElement.click();
        fileInputElement.addEventListener('change', changeListener);
        // there is no way to detect a cancelled fileInput popup
        // as a crappy workaround we add a click listener on the document
        // on top the change event listener
        // todo : listen to dirty check instead
        document.addEventListener('mousedown', changeListener);
      }, 50);

      return deferred.promise;
    },

    /**
     * Save data directly to disk, without showing a save dialog
     * Requires Node-Webkit environment for file system access
     * @param content - data to be saved
     * @param {string} filename - fill path to the file
     * @callback callback
     */
    saveToFile : function(content, filename) {
      var deferred = Q.defer();
      var fs = window.require('fs');
      fs.writeFile(filename, content, function (err) {
        if (err) {
          deferred.reject('FileUtilsDesktop::savetoFile() - error saving file: ' + filename + ' Error: ' + err);
        } else {
          deferred.resolve();
        }
      });

      return deferred.promise;
    },

    readFile : function(filename) {
      var deferred = Q.defer();
      var fs = window.require('fs');
      // NOTE: currently loading everything as utf8, which may not be desirable in future
      fs.readFile(filename, 'utf8', function (err, data) {
        if (err) {
          deferred.reject('FileUtilsDesktop::readFile() - error reading file: ' + filename + ' Error: ' + err);
        } else {
          deferred.resolve(data);
        }
      });
      return deferred.promise;
    }
  };
})();
