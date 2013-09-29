(function () {
  var ns = $.namespace("pskl.service");
  ns.ImageUploadService = function () {};
  ns.ImageUploadService.prototype.init = function () {};

  /**
   * Upload a base64 image data to distant service. If successful, will call provided callback with the image URL as first argument;
   * @param {String} imageData base64 image data (such as the return value of canvas.toDataUrl())
   * @param {Function} cbSuccess success callback. 1st argument will be the uploaded image URL
   * @param {Function} cbError error callback
   */
  ns.ImageUploadService.prototype.upload = function (imageData, cbSuccess, cbError) {
    var xhr = new XMLHttpRequest();
    var formData = new FormData();
    formData.append('data', imageData);
    xhr.open('POST', Constants.IMAGE_SERVICE_UPLOAD_URL, true);
    xhr.onload = function (e) {
      if (this.status == 200) {
        var imageUrl = Constants.IMAGE_SERVICE_GET_URL + this.responseText;
        cbSuccess(imageUrl);
      } else {
        cbError();
      }
    };

    xhr.send(formData);
  };
})();
