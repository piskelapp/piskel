(function () {
  var ns = $.namespace('pskl.model.frame');

  var DEFAULT_RESET_INTERVAL = 10 * 60 *1000;

  var DEFAULT_FRAME_PROCESSOR = function (frame) {
    return pskl.utils.FrameUtils.toImage(frame);
  };

  var DEFAULT_OUTPUT_CLONER = function (o) {return o;};

  var DEFAULT_NAMESPACE = '__cache_default__';

  ns.CachedFrameProcessor = function (cacheResetInterval) {
    this.cache_ = {};
    this.cacheResetInterval = cacheResetInterval || DEFAULT_RESET_INTERVAL;
    this.frameProcessor = DEFAULT_FRAME_PROCESSOR;
    this.outputCloner = DEFAULT_OUTPUT_CLONER;

    window.setInterval(this.clear.bind(this), this.cacheResetInterval);
  };

  ns.CachedFrameProcessor.prototype.clear = function () {
    this.cache_ = {};
  };

  ns.CachedFrameProcessor.prototype.setFrameProcessor = function (frameProcessor) {
    this.frameProcessor = frameProcessor;
  };

  ns.CachedFrameProcessor.prototype.setOutputCloner = function (outputCloner) {
    this.outputCloner = outputCloner;
  };

  ns.CachedFrameProcessor.prototype.get = function (frame, namespace) {
    var processedFrame = null;
    namespace = namespace || DEFAULT_NAMESPACE;

    if (!this.cache_[namespace]) {
      this.cache_[namespace] = {};
    }

    var cache = this.cache_[namespace];

    var cacheKey = frame.getHash();
    if (this.cache_[cacheKey]) {
      processedFrame = this.cache_[cacheKey];
    } else {
      var frameAsString = JSON.stringify(frame.getPixels());
      if (this.cache_[frameAsString]) {
        processedFrame = this.outputCloner(this.cache_[frameAsString]);
      } else {
        processedFrame = this.frameProcessor(frame);
        this.cache_[frameAsString] = processedFrame;
      }
      this.cache_[cacheKey] = processedFrame;
    }
    return processedFrame;
  };
})();