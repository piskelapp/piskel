import { assertDefined } from "../../utils/core";
import type { Frame } from "../Frame";
import type { RenderedFrame } from "./RenderedFrame";

// Maximum number of cache entries
const MAX_CACHE_ENTRIES = 100;

const DEFAULT_NAMESPACE = "__cache_default__";

export type ProcessedFrame = Frame | RenderedFrame;
export type FrameProcessor<T> = (frame: ProcessedFrame) => T;
export type OutputCloner<T> = (cached: T, frame: ProcessedFrame) => T;

export class FrameCache<T> {
  cache_: Record<string, Record<string, T | null>>;
  cacheQueue_: [namespace: string | number, key: string][];
  outputCloner: OutputCloner<T> | undefined;
  defaultNamespace: string;

  constructor() {
    // Cache object.
    this.cache_ = {};

    // Array of [namespace, key] for each cached frame.
    this.cacheQueue_ = [];

    this.defaultNamespace = DEFAULT_NAMESPACE;
  }

  clear(): void {
    this.cache_ = {};
  }

  /**
   * Set the cloner that will be called when there is a miss on the 1st level cache
   * but a hit on the 2nd level cache.
   * Function with 2 arguments : cached value, frame
   * @param {Function} outputCloner
   */
  setOutputCloner(outputCloner: OutputCloner<T>): void {
    this.outputCloner = outputCloner;
  }
}

export class CachedFrameProcessor<T> extends FrameCache<T> {
  frameProcessor: FrameProcessor<T> | undefined;

  /**
   * Set the processor function that will be called when there is a cache miss
   * Function with 1 argument : pskl.model.Frame
   * @param {Function} frameProcessor
   */
  setFrameProcessor(frameProcessor: FrameProcessor<T>): void {
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
  get(frame: ProcessedFrame, namespace?: string | number): T {
    let processedFrame: T;
    const cacheNamespace = namespace || DEFAULT_NAMESPACE;

    if (!this.cache_[cacheNamespace]) {
      this.cache_[cacheNamespace] = {};
    }

    const cache = this.cache_[cacheNamespace];

    const cacheKey = frame.getHash();
    const cached = cache[cacheKey];
    if (cached) {
      processedFrame = cached;
    } else {
      processedFrame = assertDefined(
        this.frameProcessor,
        "frameProcessor"
      )(frame);
      cache[cacheKey] = processedFrame;
      this.cacheQueue_.unshift([cacheNamespace, cacheKey]);
      if (this.cacheQueue_.length > MAX_CACHE_ENTRIES) {
        const oldestItem = assertDefined(this.cacheQueue_.pop(), "oldestItem");
        this.cache_[oldestItem[0]][oldestItem[1]] = null;
      }
    }

    return processedFrame;
  }
}
