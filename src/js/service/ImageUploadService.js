(function () {
  var ns = $.namespace('pskl.service');
  ns.ImageUploadService = function () {};
  ns.ImageUploadService.prototype.init = function () {};

  /**
   * Upload a base64 image data to distant service.
   * If successful, will call provided callback with the image URL as first argument;
   * @param {String} imageData base64 image data (such as the return value of canvas.toDataUrl())
   * @param {Function} success success callback. 1st argument will be the uploaded image URL
   * @param {Function} error error callback
   */
  ns.ImageUploadService.prototype.upload = function (imageData, success, error) {
    var data = {
      data : imageData
    };

    var wrappedSuccess = function (response) {
      success(Constants.IMAGE_SERVICE_GET_URL + response.responseText);
    };

    pskl.utils.Xhr.post(Constants.IMAGE_SERVICE_UPLOAD_URL, data, wrappedSuccess, error);
  };
})();
