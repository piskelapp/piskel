/*
 * @provide pskl.LocalStrageService
 *
 * @require Constants
 * @require Events
 */
$.namespace("pskl");

pskl.LocalStorageService = (function() {

    var frameSheet_;

    /**
     * @private
     */
    var localStorageThrottler_ = null;
    
    /**
     * @private
     */
    var persistToLocalStorageRequest_ = function() {
      // Persist to localStorage when drawing. We throttle localStorage accesses
      // for high frequency drawing (eg mousemove).
      if(localStorageThrottler_ !== null) {
          window.clearTimeout(localStorageThrottler_);
      }
      localStorageThrottler_ = window.setTimeout(function() {
        persistToLocalStorage_();
        localStorageThrottler_ = null;
      }, 1000);
    };

    /**
     * @private
     */
    var persistToLocalStorage_ = function() {
      console.log('[LocalStorage service]: Snapshot stored');
      window.localStorage.snapShot = frameSheet_.serialize();
    };

    /**
     * @private
     */
    var restoreFromLocalStorage_ = function() {
      frameSheet_.deserialize(window.localStorage.snapShot);
    };

    /**
     * @private
     */
    var cleanLocalStorage_ = function() {
      console.log('[LocalStorage service]: Snapshot removed');
      delete window.localStorage.snapShot;
    };  

    return {
        init: function(frameSheet) {

            if(frameSheet === undefined) {
                throw "Bad LocalStorageService initialization: <undefined frameSheet>";
            }
            frameSheet_ = frameSheet;

            $.subscribe(Events.LOCALSTORAGE_REQUEST, persistToLocalStorageRequest_);
        },

        // TODO(vincz): Find a good place to put this UI rendering, a service should not render UI.
        displayRestoreNotification: function() {
            if(window.localStorage && window.localStorage.snapShot) {
                var reloadLink = "<a href='#' class='localstorage-restore onclick='piskel.restoreFromLocalStorage()'>reload</a>";
                var discardLink = "<a href='#' class='localstorage-discard' onclick='piskel.cleanLocalStorage()'>discard</a>";
                var content = "Non saved version found. " + reloadLink + " or " + discardLink;

                $.publish(Events.SHOW_NOTIFICATION, [{
                    "content": content,
                    "behavior": function(rootNode) {
                        rootNode = $(rootNode);
                        rootNode.click(function(evt) {
                            var target = $(evt.target);
                            if(target.hasClass("localstorage-restore")) {
                                restoreFromLocalStorage_();
                            }
                            else if (target.hasClass("localstorage-discard")) {
                                cleanLocalStorage_();
                            }
                            $.publish(Events.HIDE_NOTIFICATION);
                        });
                    }
                }]);
            }
        }
    };
})();