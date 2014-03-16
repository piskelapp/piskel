(function () {
  var ns = $.namespace('pskl.service');

  ns.GithubStorageService = function (piskelController) {
    this.piskelController = piskelController;
  };

  ns.GithubStorageService.prototype.init = function () {};

  ns.GithubStorageService.prototype.store = function (callbacks) {
    var xhr = new XMLHttpRequest();
    var formData = new FormData();
    formData.append('framesheet_content', this.piskelController.serialize());
    formData.append('fps_speed', this.piskelController.getFPS());

    xhr.open('POST', Constants.STATIC.URL.SAVE, true);

    xhr.onload = function(e) {
      if (this.status == 200) {
        var baseUrl = window.location.href.replace(window.location.search, "");
        window.location.href = baseUrl + "?frameId=" + this.responseText;
      } else {
        this.onerror(e);
      }
    };
    xhr.onerror = function(e) {
      $.publish(Events.SHOW_NOTIFICATION, [{"content": "Saving failed ("+this.status+")"}]);
    };
    xhr.send(formData);
  };
})();