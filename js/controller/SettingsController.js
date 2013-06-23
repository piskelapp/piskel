(function () {
    var ns = $.namespace("pskl.controller");
  
    ns.SettingsController = function () {};

    /**
     * @public
     */
    ns.SettingsController.prototype.init = function() {

        // Highlight selected background picker:
        var backgroundClass = pskl.UserSettings.get(pskl.UserSettings.CANVAS_BACKGROUND);
        $('#background-picker-wrapper')
            .find('.background-picker[data-background-class=' + backgroundClass + ']')
            .addClass('selected');

        // Initial state for grid display:
        var show_grid = pskl.UserSettings.get(pskl.UserSettings.SHOW_GRID);
        $('#show-grid').prop('checked', show_grid);

        // Expand drawer when clicking 'Settings' tab.
        $('#settings').click(function(evt) {
            $('.right-sticky-section').toggleClass('expanded');
            $('#settings').toggleClass('has-expanded-drawer');
        });

        // Handle grid display changes:
        $('#show-grid').change($.proxy(function(evt) {
            var checked = $('#show-grid').prop('checked');
            pskl.UserSettings.set(pskl.UserSettings.SHOW_GRID, checked);
        }, this));

        // Handle canvas background changes:
        $('#background-picker-wrapper').click(function(evt) {
          var target = $(evt.target).closest('.background-picker');
          if (target.length) {
            var backgroundClass = target.data('background-class');
            pskl.UserSettings.set(pskl.UserSettings.CANVAS_BACKGROUND, backgroundClass);

            $('.background-picker').removeClass('selected');
            target.addClass('selected');
          }
        });
    };
})();