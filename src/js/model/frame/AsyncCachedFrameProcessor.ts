import { assertDefined } from "../../utils/core";
import type { Frame } from "../Frame";
import { FrameCache } from "./CachedFrameProcessor";

export type AsyncFrameProcessor<T> = (
  frame: Frame,
  callback: (result: T) => void
) => void;

export class AsyncCachedFrameProcessor<T> extends FrameCache<T> {
  frameProcessor: AsyncFrameProcessor<T> | undefined;

  setFrameProcessor(frameProcessor: AsyncFrameProcessor<T>): void {
    this.frameProcessor = frameProcessor;
  }

  /**
   * Retrieve the processed frame from the cache, in the (optional) namespace
   * If the first level cache is empty, attempt to clone it from 2nd level cache.
   * If second level cache is empty process the frame.
   * @param  {pskl.model.Frame} frame
   * @param  {String} namespace
   * @return {Object} the processed frame
   */
  get(frame: Frame, namespace?: string | number): Promise<T> {
    const cacheNamespace = namespace || this.defaultNamespace;

    if (!this.cache_[cacheNamespace]) {
      this.cache_[cacheNamespace] = {};
    }

    const cache = this.cache_[cacheNamespace];
    const key1 = frame.getHash();

    const cached = cache[key1];
    if (cached) {
      return Promise.resolve(cached);
    }

    return new Promise<T>((resolve) => {
      const callback = this.onProcessorComplete_.bind(
        this,
        resolve,
        cache,
        key1
      );
      assertDefined(this.frameProcessor, "frameProcessor")(frame, callback);
    });
  }

  onProcessorComplete_(
    resolve: (result: T) => void,
    cache: Record<string, T | null>,
    key1: string,
    result: T
  ): void {
    cache[key1] = result;
    resolve(result);
  }
}
