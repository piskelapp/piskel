(function () {
  var ns = $.namespace('pskl.utils');
  ns.Xhr = {
    get : function (url, success, error) {
      var xhr = ns.Xhr.xhr_(url, 'GET', success, error);
      xhr.send();
    },

    post : function (url, data, success, error) {
      var xhr = ns.Xhr.xhr_(url, 'POST', success, error);
      var formData = new FormData();

      if (typeof data == 'object') {
        for (var key in data) {
          if (data.hasOwnProperty(key)) {
            formData.append(key, data[key]);
          }
        }
      }

      xhr.send(formData);
    },

    xhr_ : function (url, method, success, error) {
      success = success || function () {};
      error = error || function () {};

      var xhr = new XMLHttpRequest();
      xhr.open(method, url, true);

      xhr.onload = function (e) {
        if (this.status == 200) {
          success(this);
        } else {
          this.onerror(this, e);
        }
      };

      xhr.onerror = function (e) {
        error(e, this);
      };

      return xhr;
    }
  };
})();
