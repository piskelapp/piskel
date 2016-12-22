(function () {
  var ns = $.namespace('pskl');

  ns.UserSettings = {
    GRID_WIDTH : 'GRID_WIDTH',
    MAX_FPS : 'MAX_FPS',
    DEFAULT_SIZE : 'DEFAULT_SIZE',
    CANVAS_BACKGROUND : 'CANVAS_BACKGROUND',
    SELECTED_PALETTE : 'SELECTED_PALETTE',
    SEAMLESS_OPACITY : 'SEAMLESS_OPACITY',
    SEAMLESS_MODE : 'SEAMLESS_MODE',
    ORIGINAL_SIZE_PREVIEW : 'ORIGINAL_SIZE_PREVIEW',
    ONION_SKIN : 'ONION_SKIN',
    LAYER_PREVIEW : 'LAYER_PREVIEW',
    LAYER_OPACITY : 'LAYER_OPACITY',
    EXPORT_SCALE: 'EXPORT_SCALE',
    EXPORT_TAB: 'EXPORT_TAB',
    PEN_SIZE : 'PEN_SIZE',
    RESIZE_SETTINGS: 'RESIZE_SETTINGS',
    KEY_TO_DEFAULT_VALUE_MAP_ : {
      'GRID_WIDTH' : 0,
      'MAX_FPS' : 24,
      'DEFAULT_SIZE' : {
        width : Constants.DEFAULT.WIDTH,
        height : Constants.DEFAULT.HEIGHT
      },
      'CANVAS_BACKGROUND' : 'lowcont-dark-canvas-background',
      'SELECTED_PALETTE' : Constants.CURRENT_COLORS_PALETTE_ID,
      'SEAMLESS_OPACITY' : 0.30,
      'SEAMLESS_MODE' : false,
      'ORIGINAL_SIZE_PREVIEW' : false,
      'ONION_SKIN' : false,
      'LAYER_OPACITY' : 0.2,
      'LAYER_PREVIEW' : true,
      'EXPORT_SCALE' : 1,
      'EXPORT_TAB' : 'gif',
      'PEN_SIZE' : 1,
      'RESIZE_SETTINGS': {
        maintainRatio : true,
        resizeContent : false,
        origin : 'TOPLEFT'
      }
    },

    /**
     * @private
     */
    cache_ : {},

    /**
     * Static method to access a user defined settings value ot its default
     * value if not defined yet.
     */
    get : function (key) {
      this.checkKeyValidity_(key);
      if (!(key in this.cache_)) {
        var storedValue = this.readFromLocalStorage_(key);
        if (typeof storedValue !== 'undefined' && storedValue !== null) {
          this.cache_[key] = storedValue;
        } else {
          this.cache_[key] = this.readFromDefaults_(key);
        }
      }
      return this.cache_[key];
    },

    set : function (key, value) {
      this.checkKeyValidity_(key);
      this.cache_[key] = value;
      this.writeToLocalStorage_(key, value);

      $.publish(Events.USER_SETTINGS_CHANGED, [key, value]);
    },

    /**
     * @private
     */
    readFromLocalStorage_ : function(key) {
      var value = window.localStorage[key];
      if (typeof value != 'undefined') {
        value = JSON.parse(value);
      }
      return value;
    },

    /**
     * @private
     */
    writeToLocalStorage_ : function(key, value) {
      // TODO(grosbouddha): Catch storage exception here.
      window.localStorage[key] = JSON.stringify(value);
    },

    /**
     * @private
     */
    readFromDefaults_ : function (key) {
      return this.KEY_TO_DEFAULT_VALUE_MAP_[key];
    },

    /**
     * @private
     */
    checkKeyValidity_ : function(key) {
      if (key.indexOf(pskl.service.keyboard.Shortcut.USER_SETTINGS_PREFIX) === 0) {
        return true;
      }

      var isValidKey = key in this.KEY_TO_DEFAULT_VALUE_MAP_;
      if (!isValidKey) {
        console.error('UserSettings key <' + key + '> not found in supported keys.');
      }
    }
  };
})();
