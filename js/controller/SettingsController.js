(function () {
    var ns = $.namespace("pskl.controller");
  
    ns.SettingsController = function () {};

    /**
     * Get state for the checkbox that control the display of the grid
     * on the drawing canvas.
     * @private
     */
    ns.SettingsController.prototype.isShowGridChecked_ = function() {
        var showGridCheckbox = $('#show-grid');
        var isChecked = showGridCheckbox.is(':checked');
        return isChecked;
    };

    // TODO(vincz): add get/set store

    /**
     * @public
     */
    ns.SettingsController.prototype.init = function() {

        // Expand drawer when clicking 'Settings' tab.
        $('#settings').click(function(evt) {
            $('.right-sticky-section').toggleClass('expanded');
            $('#settings').toggleClass('has-expanded-drawer');
        });

        // Show/hide the grid on drawing canvas:
        $.publish(Events.GRID_DISPLAY_STATE_CHANGED, [this.isShowGridChecked_()]);
        $('#show-grid').change($.proxy(function(evt) {
            var checked = this.isShowGridChecked_();
            $.publish(Events.GRID_DISPLAY_STATE_CHANGED, [checked]);
        }, this));

        // Handle canvas background changes:
        $('#background-picker-wrapper').click(function(evt) {
          var target = $(evt.target).closest('.background-picker');
          if (target.length) {
          	var backgroundClass = target.data('background');
          	var body = $('body');
          	body.removeClass(body.data('current-background'));
          	body.addClass(backgroundClass);
            body.data('current-background', backgroundClass);

            $('.background-picker').removeClass('selected');
            target.addClass('selected');
          }
        });
    };
})();