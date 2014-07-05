(function () {
  var ns = $.namespace("pskl");

  ns.UserSettings = {
    GRID_WIDTH : 'GRID_WIDTH',
    CANVAS_BACKGROUND : 'CANVAS_BACKGROUND',
    SELECTED_PALETTE : 'SELECTED_PALETTE',
    TILED_PREVIEW : 'TILED_PREVIEW',
    ONION_SKIN : 'ONION_SKIN',
    LAYER_PREVIEW : 'LAYER_PREVIEW',

    KEY_TO_DEFAULT_VALUE_MAP_ : {
      'GRID_WIDTH' : 0,
      'CANVAS_BACKGROUND' : 'lowcont-dark-canvas-background',
      'SELECTED_PALETTE' : Constants.CURRENT_COLORS_PALETTE_ID,
      'TILED_PREVIEW' : false,
      'ONION_SKIN' : false,
      'LAYER_PREVIEW' : true
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
      if (typeof value != "undefined") {
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
      if(!(key in this.KEY_TO_DEFAULT_VALUE_MAP_)) {
        // TODO(grosbouddha): Define error catching strategy and throw exception from here.
        console.log("UserSettings key <"+ key +"> not find in supported keys.");
      }
    }
  };
})();