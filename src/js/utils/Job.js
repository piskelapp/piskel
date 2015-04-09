(function () {
  var ns = $.namespace('pskl.utils');

  ns.Job = function (cfg) {
    this.args = cfg.args;
    this.items = cfg.items;

    this.process = cfg.process;
    this.onProcessEnd = cfg.onProcessEnd;
    this.onComplete = cfg.onComplete;

    this.completed_ = 0;
  };

  ns.Job.prototype.start = function () {
    this.items.forEach(function (item, index) {
      this.process(item, this.processCallback.bind(this, index));
    }.bind(this))
  };

  ns.Job.prototype.processCallback = function (index, args) {
    this.completed_++;
    this.onProcessEnd(args, index);

    if (this.completed_ === this.items.length) {
      this.onComplete(this.args);
    }
  }
})();