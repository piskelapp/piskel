(function () {
  var ns = $.namespace('pskl.model.frame');


  var DEFAULT_CLEAR_INTERVAL = 10 * 60 *1000;

  var DEFAULT_FRAME_PROCESSOR = function (frame) {
    return pskl.utils.FrameUtils.toImage(frame);
  };

  var DEFAULT_OUTPUT_CLONER = function (o) {return o;};

  var DEFAULT_NAMESPACE = '__cache_default__';

  ns.CachedFrameProcessor = function (cacheResetInterval) {
    this.cache_ = {};
    this.cacheResetInterval = cacheResetInterval || DEFAULT_CLEAR_INTERVAL;
    this.frameProcessor = DEFAULT_FRAME_PROCESSOR;
    this.outputCloner = DEFAULT_OUTPUT_CLONER;

    window.setInterval(this.clear.bind(this), this.cacheResetInterval);
  };

  ns.CachedFrameProcessor.prototype.clear = function () {
    this.cache_ = {};
  };

  /**
   * Set the processor function that will be called when there is a cache miss
   * Function with 1 argument : pskl.model.Frame
   * @param {Function} frameProcessor
   */
  ns.CachedFrameProcessor.prototype.setFrameProcessor = function (frameProcessor) {
    this.frameProcessor = frameProcessor;
  };

  /**
   * Set the cloner that will be called when there is a miss on the 1st level cache
   * but a hit on the 2nd level cache.
   * Function with 2 arguments : cached value, frame
   * @param {Function} outputCloner
   */
  ns.CachedFrameProcessor.prototype.setOutputCloner = function (outputCloner) {
    this.outputCloner = outputCloner;
  };

  /**
   * Retrieve the processed frame from the cache, in the (optional) namespace
   * If the first level cache is empty, attempt to clone it from 2nd level cache. If second level cache is empty process the frame.
   * @param  {pskl.model.Frame} frame
   * @param  {String} namespace
   * @return {Object} the processed frame
   */
  ns.CachedFrameProcessor.prototype.get = function (frame, namespace) {
    var processedFrame = null;
    namespace = namespace || DEFAULT_NAMESPACE;

    if (!this.cache_[namespace]) {
      this.cache_[namespace] = {};
    }

    var cache = this.cache_[namespace];

    var cacheKey = frame.getHash();
    if (cache[cacheKey]) {
      processedFrame = cache[cacheKey];
    } else {
      var framePixels = JSON.stringify(frame.getPixels());
      var frameAsString = pskl.utils.hashCode(framePixels);
      if (cache[frameAsString]) {
        processedFrame = this.outputCloner(cache[frameAsString], frame);
      } else {
        processedFrame = this.frameProcessor(frame);
        cache[frameAsString] = processedFrame;
      }
      cache[cacheKey] = processedFrame;
    }
    return processedFrame;
  };
})();