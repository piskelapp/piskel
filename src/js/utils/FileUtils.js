(function () {
  var ns = $.namespace("pskl.utils");

  var stopPropagation = function (e) {
    e.stopPropagation();
  };

  ns.FileUtils = {
    readFile: function (file, callback) {
      var reader = new FileReader();
      reader.addEventListener("loadend", function () {
        callback(reader.result);
      });
      reader.readAsDataURL(file);
    },

    readFileAsArrayBuffer: function (file, callback) {
      var reader = new FileReader();
      reader.addEventListener("loadend", function () {
        callback(reader.result);
      });
      reader.readAsArrayBuffer(file);
    },

    readImageFile: function (file, callback) {
      ns.FileUtils.readFile(file, function (content) {
        var image = new Image();
        image.onload = callback.bind(null, image);
        image.src = content;
      });
    },

    downloadAsFile: function (content, filename) {
      var downloadLink = document.createElement("a");
      var url = window.URL.createObjectURL(content);
      downloadLink.setAttribute("href", url);
      downloadLink.setAttribute("download", filename);
      document.body.appendChild(downloadLink);
      downloadLink.addEventListener("click", stopPropagation);
      downloadLink.click();
      downloadLink.removeEventListener("click", stopPropagation);
      document.body.removeChild(downloadLink);
    }
  };
})();
