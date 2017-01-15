(function () {
  var ns = $.namespace('pskl.controller');

  ns.UserWarningController = function (piskelController, currentColorsService) {
    this.piskelController = piskelController;
    this.currentColorsService = currentColorsService;
  };

  // This method is not attached to the prototype because we want to trigger it
  // from markup generated for a notification message.
  ns.UserWarningController.showPerformanceInfoDialog = function () {
    $.publish(Events.DIALOG_SHOW, {
      dialogId: 'performance-info'
    });
  };

  ns.UserWarningController.prototype.init = function () {
    $.subscribe(Events.PERFORMANCE_REPORT_CHANGED, this.onPerformanceReportChanged_.bind(this));

    this.performanceLinkEl = document.querySelector('.performance-link');
    pskl.utils.Event.addEventListener(
      this.performanceLinkEl,
      'click',
      ns.UserWarningController.showPerformanceInfoDialog,
      this
    );
  };

  ns.UserWarningController.prototype.destroy = function () {
    pskl.utils.Event.removeAllEventListeners(this);
    this.performanceLinkEl = null;
  };

  ns.UserWarningController.prototype.onPerformanceReportChanged_ = function (event, report) {
    var shouldDisplayWarning = report.hasProblem();

    // Check if a performance warning is already displayed.
    var isWarningDisplayed = this.performanceLinkEl.classList.contains('visible');

    // Show/hide the performance warning link depending on the received report.
    if (shouldDisplayWarning) {
      this.performanceLinkEl.classList.add('visible');
    } else {
      this.performanceLinkEl.classList.remove('visible');
    }

    // Show a notification message if the new report indicates a performance issue
    // and we were not displaying a warning before.
    if (shouldDisplayWarning && !isWarningDisplayed) {
      $.publish(Events.SHOW_NOTIFICATION, [{
        'content': 'Performance problem detected, ' +
                   '<a href="#" style="color:red;"' +
                       'onclick="pskl.controller.UserWarningController.showPerformanceInfoDialog()">' +
                      'learn more?</a>',
        'hideDelay' : 5000
      }]);
    }
  };
})();
