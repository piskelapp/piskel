(function () {
  var ns = $.namespace('pskl.controller');

  ns.UserWarningController = function (piskelController, currentColorsService) {
    this.piskelController = piskelController;
    this.currentColorsService = currentColorsService;
    this.isWarningDisplayed = false;
  };

  ns.UserWarningController.prototype.init = function () {
    $.subscribe(Events.PERFORMANCE_REPORT_CHANGED, this.onPerformanceReportChanged_.bind(this));
  };

  ns.UserWarningController.prototype.onPerformanceReportChanged_ = function (event, report) {
    console.log(report);

    var shouldDisplayWarning = report.hasProblem();
    if (shouldDisplayWarning && !this.isWarningDisplayed) {
      // show a notification
      // show the warning bubble
      $.publish(Events.SHOW_NOTIFICATION, [{
        'content': 'performance problem notification',
        'hideDelay' : 5000
      }]);
      console.log('should show a performance notification');
      this.isWarningDisplayed = true;
    }

    if (!shouldDisplayWarning && this.isWarningDisplayed) {
      // hide the warning bubble
      console.log('should hide a performance notification');
      this.isWarningDisplayed = false;
    }
  };
})();
