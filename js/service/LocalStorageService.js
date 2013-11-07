(function () {
  var ns = $.namespace("pskl.service");

  ns.LocalStorageService = function (piskelController) {

    if(piskelController === undefined) {
      throw "Bad LocalStorageService initialization: <undefined piskelController>";
    }
    this.piskelController = piskelController;
    this.localStorageThrottler_ = null;
  };

  /**
   * @public
   */
  ns.LocalStorageService.prototype.init = function(piskelController) {
    $.subscribe(Events.LOCALSTORAGE_REQUEST, $.proxy(this.persistToLocalStorageRequest_, this));
  };

  /**
   * @private
   */
  ns.LocalStorageService.prototype.persistToLocalStorageRequest_ = function () {
    // Persist to localStorage when drawing. We throttle localStorage accesses
    // for high frequency drawing (eg mousemove).
    if(this.localStorageThrottler_ !== null) {
      window.clearTimeout(this.localStorageThrottler_);
    }
    this.localStorageThrottler_ = window.setTimeout($.proxy(function() {
      this.persistToLocalStorage_();
      this.localStorageThrottler_ = null;
    }, this), 1000);
  };

  /**
   * @private
   */
  ns.LocalStorageService.prototype.persistToLocalStorage_ = function() {
    console.log('[LocalStorage service]: Snapshot stored');
    window.localStorage.snapShot = this.piskelController.serialize();
  };

  /**
   * @private
   */
  ns.LocalStorageService.prototype.restoreFromLocalStorage_ = function() {
    var framesheet = JSON.parse(window.localStorage.snapShot);
    var piskel = pskl.utils.Serializer.createPiskel(framesheet);
    pskl.app.piskelController.setPiskel(piskel);
  };

  /**
   * @private
   */
  ns.LocalStorageService.prototype.cleanLocalStorage_ = function() {
    console.log('[LocalStorage service]: Snapshot removed');
    delete window.localStorage.snapShot;
  };

  /**
   * @public
   */
  ns.LocalStorageService.prototype.displayRestoreNotification = function() {
    if(window.localStorage && window.localStorage.snapShot) {
      var reloadLink = "<a href='#' class='localstorage-restore onclick='pskl.app.restoreFromLocalStorage()'>reload</a>";
      var discardLink = "<a href='#' class='localstorage-discard' onclick='pskl.app.cleanLocalStorage()'>discard</a>";
      var content = "Non saved version found. " + reloadLink + " or " + discardLink;

      $.publish(Events.SHOW_NOTIFICATION, [{
        "content": content,
        "behavior": $.proxy(function(rootNode) {
          rootNode = $(rootNode);
          rootNode.click($.proxy(function(evt) {
            var target = $(evt.target);
            if(target.hasClass("localstorage-restore")) {
              this.restoreFromLocalStorage_();
            }
            else if (target.hasClass("localstorage-discard")) {
              this.cleanLocalStorage_();
            }
            $.publish(Events.HIDE_NOTIFICATION);
          }, this));
        }, this)
      }]);
    }
  };
})();