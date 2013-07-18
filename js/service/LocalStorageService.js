(function () {
  var ns = $.namespace("pskl.service");

  ns.LocalStorageService = function (framesheet_) {

    if(framesheet_ === undefined) {
        throw "Bad LocalStorageService initialization: <undefined frameSheet>";
    }
    this.framesheet = framesheet_;
    this.localStorageThrottler_ = null;
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
    window.localStorage.snapShot = this.framesheet.serialize();
  };

  /**
   * @private
   */
  ns.LocalStorageService.prototype.restoreFromLocalStorage_ = function() {

    this.framesheet.deserialize(window.localStorage.snapShot);
    this.framesheet.setCurrentFrameIndex(0);
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
  ns.LocalStorageService.prototype.init = function(framesheet_) {
    $.subscribe(Events.LOCALSTORAGE_REQUEST, $.proxy(this.persistToLocalStorageRequest_, this));
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