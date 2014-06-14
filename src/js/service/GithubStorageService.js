(function () {
  var ns = $.namespace('pskl.service');

  ns.GithubStorageService = function (piskelController) {
    this.piskelController = piskelController;
  };

  ns.GithubStorageService.prototype.init = function () {};

  ns.GithubStorageService.prototype.store = function (callbacks) {
    throw "Github save is no longer available. Use local save instead";
  };
})();