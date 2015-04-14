(function () {
  var ns = $.namespace('pskl.controller.settings');
  ns.AbstractSettingController = function () {};

  ns.AbstractSettingController.prototype.addEventListener = function (el, type, callback) {
    pskl.utils.Event.addEventListener(el, type, callback, this);
  };

  ns.AbstractSettingController.prototype.destroy = function () {
    pskl.utils.Event.removeAllEventListeners(this);
    this.nullifyDomReferences_();
  };

  ns.AbstractSettingController.prototype.nullifyDomReferences_ = function () {
    for (var key in this) {
      if (this.hasOwnProperty(key)) {
        var isHTMLElement = this[key] && this[key].nodeName;
        if (isHTMLElement) {
          this[key] = null;
        }
      }
    }
  };
})();
