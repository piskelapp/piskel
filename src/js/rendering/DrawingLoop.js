(function () {
  var ns = $.namespace('pskl.rendering');

  ns.DrawingLoop = function () {
    this.requestAnimationFrame = this.getRequestAnimationFrameShim_();
    this.isRunning = false;
    this.previousTime = 0;
    this.callbacks = [];
    this.loop_ = this.loop_.bind(this);
  };

  ns.DrawingLoop.prototype.addCallback = function (callback, scope, args) {
    var callbackObj = {
      fn : callback,
      scope : scope,
      args : args
    };
    this.callbacks.push(callbackObj);
    return callbackObj;
  };

  ns.DrawingLoop.prototype.removeCallback = function (callbackObj) {
    var index = this.callbacks.indexOf(callbackObj);
    if (index != -1) {
      this.callbacks.splice(index, 1);
    }
  };

  ns.DrawingLoop.prototype.start = function () {
    this.isRunning = true;
    this.loop_();
  };

  ns.DrawingLoop.prototype.loop_ = function () {
    var currentTime = Date.now();
    var delta = currentTime - this.previousTime;
    this.executeCallbacks_(delta);
    this.previousTime = currentTime;
    this.requestAnimationFrame.call(window, this.loop_);
  };

  ns.DrawingLoop.prototype.executeCallbacks_ = function (deltaTime) {
    for (var i = 0 ; i < this.callbacks.length ; i++) {
      var cb = this.callbacks[i];
      cb.fn.call(cb.scope, deltaTime, cb.args);
    }
  };

  ns.DrawingLoop.prototype.stop = function () {
    this.isRunning = false;
  };

  ns.DrawingLoop.prototype.getRequestAnimationFrameShim_ = function () {
    var requestAnimationFrame = window.requestAnimationFrame ||
                  window.mozRequestAnimationFrame ||
                  window.webkitRequestAnimationFrame ||
                  window.msRequestAnimationFrame ||
                  function (callback) { window.setTimeout(callback, 1000 / 60); };

    return requestAnimationFrame;
  };
})();
