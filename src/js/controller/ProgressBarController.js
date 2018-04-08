(function () {
  var ns = $.namespace('pskl.controller');

  ns.ProgressBarController = function () {
    this.template = pskl.utils.Template.get('progress-bar-template');
    this.progressBar = null;
    this.progressBarStatus = null;

    this.showProgressTimer_ = 0;
  };

  ns.ProgressBarController.prototype.init = function () {
    $.subscribe(Events.SHOW_PROGRESS, this.showProgress_.bind(this));
    $.subscribe(Events.UPDATE_PROGRESS, this.updateProgress_.bind(this));
    $.subscribe(Events.HIDE_PROGRESS, this.hideProgress_.bind(this));
  };

  ns.ProgressBarController.prototype.showProgress_ = function (event, progressInfo) {
    this.removeProgressBar_();
    this.showProgressTimer_ = window.setTimeout(this.onTimerExpired_.bind(this, progressInfo), 300);
  };

  ns.ProgressBarController.prototype.onTimerExpired_ = function (progressInfo) {
    var progressBarHtml = pskl.utils.Template.replace(this.template, {
      name : progressInfo.name,
      status : 0
    });

    var progressBarEl = pskl.utils.Template.createFromHTML(progressBarHtml);
    document.body.appendChild(progressBarEl);

    this.progressBar = document.querySelector('.progress-bar');
    this.progressBarStatus = document.querySelector('.progress-bar-status');
  };

  ns.ProgressBarController.prototype.updateProgress_ = function (event, progressInfo) {
    if (this.progressBar && this.progressBarStatus) {
      var progress = progressInfo.progress;
      var width = this.progressBar.offsetWidth;
      var progressWidth = width - ((progress * width) / 100);
      this.progressBar.style.backgroundPosition = (-progressWidth) + 'px 0';
      this.progressBarStatus.innerHTML = progress + '%';
    }
  };

  ns.ProgressBarController.prototype.hideProgress_ = function (event, progressInfo) {
    if (this.showProgressTimer_) {
      window.clearTimeout(this.showProgressTimer_);
    }
    this.removeProgressBar_();
  };

  ns.ProgressBarController.prototype.removeProgressBar_ = function () {
    var progressBarContainer = document.querySelector('.progress-bar-container');
    if (progressBarContainer) {
      progressBarContainer.parentNode.removeChild(progressBarContainer);
      this.progressBar = null;
      this.progressBarStatus = null;
    }
  };
})();
