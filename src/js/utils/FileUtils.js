(function () {
  var ns = $.namespace('pskl.utils');

  ns.FileUtils = {
    readFile : function (file, callback) {
      var reader = new FileReader();
      reader.onload = function(event){
        callback(event.target.result);
      };
      reader.readAsDataURL(file);
    },

    downloadAsFile : function (filename, content) {
      var saveAs = window.saveAs || (navigator.msSaveBlob && navigator.msSaveBlob.bind(navigator));
      if (saveAs) {
        saveAs(content, filename);
      } else {
        var downloadLink = document.createElement('a');
        content = window.URL.createObjectURL(content);
        downloadLink.setAttribute('href', content);
        downloadLink.setAttribute('download', filename);
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    }
  };
})();
