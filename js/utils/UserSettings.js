(function () {
    var ns = $.namespace("pskl");

    ns.UserSettings = {

        SHOW_GRID: 'SHOW_GRID',

        KEY_TO_DEFAULT_VALUE_MAP_ : {
            'SHOW_GRID' : false
        },

        /**
         * @private
         */
        cache_: {

        },

        /**
         * Static method to access a user defined settings value ot its default 
         * value if not defined yet.
         */
        get : function (key) {
            this.checKeyValidity_(key);
            if (key in this.cache_) {
                return cache[key];
            }
            return this.get_(key);
        },

        set : function (key, value) {
           this.checKeyValidity_(key);
           this.cache_[key] = value;
           this.set_(key, value);  
        },

        /**
         * @private
         */
        get_ : function(key) {
            var value = window.localStorage[key];
            if (value === undefined) {
                value = this.KEY_TO_DEFAULT_VALUE_MAP_[key];
            }
            else {
                var entry = JSON.parse(value);
                value = entry.jsonValue;
            }
            return value;
        },

        /**
         * @private
         */
        set_ : function(key, value) {
            var entry = { 'jsonValue': value };
            window.localStorage[key] = JSON.stringify(entry);
        },

        checKeyValidity_ : function(key) {
            if(key in this.KEY_TO_DEFAULT_VALUE_MAP_) {
                return true;
            }
            console.log("UserSettings key <"+ key +"> not find in supported keys.")
            return false;
        }
    };
})();