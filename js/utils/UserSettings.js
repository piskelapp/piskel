(function () {
    var ns = $.namespace("pskl");

    ns.UserSettings = {

        SHOW_GRID : 'SHOW_GRID',
        CANVAS_BACKGROUND : 'CANVAS_BACKGROUND',

        KEY_TO_DEFAULT_VALUE_MAP_ : {
            'SHOW_GRID' : false,
            'CANVAS_BACKGROUND' : 'medium-canvas-background' 
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
                this.cache_[key] =
                    this.readFromLocalStorage_(key) || this.readFromDefaults_(key);
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