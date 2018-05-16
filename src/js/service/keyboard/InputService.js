(function () {
  var ns = $.namespace('pskl.service.keyboard');

  ns.InputService = function () {
    this.activeShortcuts_ = {};
  };

  /**
   * @public
   */
  ns.InputService.prototype.init = function() {
    $(document.body).keydown($.proxy(this.onKeyDown_, this));
    $(document.body).keyup($.proxy(this.onKeyUp_, this));
  };

  ns.InputService.prototype.isKeyPressed = function (shortcut) {
    return shortcut.getKeys().some(function (key) {
      return this.activeShortcuts_[key];
    }.bind(this));
  };

  /**
   * @private
   */
  ns.InputService.prototype.onKeyDown_ = function(evt) {
    var eventKey = ns.KeyUtils.createKeyFromEvent(evt);
    if (this.isInInput_(evt) || !eventKey) {
      return;
    }

    this.activeShortcuts_[ns.KeyUtils.stringify(eventKey)] = true;
  };

  ns.InputService.prototype.onKeyUp_ = function(evt) {
    var eventKey = ns.KeyUtils.createKeyFromEvent(evt);
    if (this.isInInput_(evt) || !eventKey) {
      return;
    }

    this.activeShortcuts_[ns.KeyUtils.stringify(eventKey)] = false;
  };

  ns.InputService.prototype.isInInput_ = function (evt) {
    var targetTagName = evt.target.nodeName.toUpperCase();
    return targetTagName === 'INPUT' || targetTagName === 'TEXTAREA';
  };

})();
