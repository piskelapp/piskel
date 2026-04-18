(function () {
  var ns = $.namespace("pskl.model.frame");

  ns.AsyncCachedFrameProcessor = function (cacheResetInterval) {
    ns.CachedFrameProcessor.call(this, cacheResetInterval);
  };

  pskl.utils.inherit(ns.AsyncCachedFrameProcessor, ns.CachedFrameProcessor);

  /**
   * Retrieve the processed frame from the cache, in the (optional) namespace
   * If the first level cache is empty, attempt to clone it from 2nd level cache.
   * If second level cache is empty process the frame.
   * @param  {pskl.model.Frame} frame
   * @param  {String} namespace
   * @return {Object} the processed frame
   */
  ns.AsyncCachedFrameProcessor.prototype.get = function (frame, namespace) {
    namespace = namespace || this.defaultNamespace;

    if (!this.cache_[namespace]) {
      this.cache_[namespace] = {};
    }

    var cache = this.cache_[namespace];
    var key1 = frame.getHash();

    if (cache[key1]) {
      return Promise.resolve(cache[key1]);
    }

    return new Promise(
      function (resolve) {
        var callback = this.onProcessorComplete_.bind(
          this,
          resolve,
          cache,
          key1
        );
        this.frameProcessor(frame, callback);
      }.bind(this)
    );
  };

  ns.AsyncCachedFrameProcessor.prototype.onProcessorComplete_ = function (
    resolve,
    cache,
    key1,
    result
  ) {
    cache[key1] = result;
    resolve(result);
  };
})();
