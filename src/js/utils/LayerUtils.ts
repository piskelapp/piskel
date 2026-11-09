import type { Frame } from "../model/Frame";
import { Layer } from "../model/Layer";
import { RenderedFrame } from "../model/frame/RenderedFrame";
import { CanvasUtils } from "./CanvasUtils";
import { FrameUtils } from "./FrameUtils";
import { assertDefined } from "./core";

export const LayerUtils = {
  clone(layer: Layer): Layer {
    const clonedFrames = layer.getFrames().map(function (frame: Frame) {
      return frame.clone();
    });
    return Layer.fromFrames(layer.getName() + " (clone)", clonedFrames);
  },

  mergeLayers(layerA: Layer, layerB: Layer): Layer {
    const framesA = layerA.getFrames();
    const framesB = layerB.getFrames();
    const mergedFrames: Frame[] = [];
    framesA.forEach(function (frame: Frame, index: number) {
      const otherFrame = framesB[index];
      mergedFrames.push(
        assertDefined(FrameUtils.merge([otherFrame, frame]), "mergedFrame")
      );
    });
    const mergedLayer = Layer.fromFrames(layerA.getName(), mergedFrames);
    return mergedLayer;
  },

  getFrameHashAt(layers: Layer[], index: number): string {
    const hashBuffer: (string | number)[] = [];
    layers.forEach(function (l) {
      const frame = l.getFrameAt(index);
      hashBuffer.push(frame.getHash());
      hashBuffer.push(l.getOpacity());
      return frame;
    });
    return hashBuffer.join("-");
  },

  /**
   * Create a frame instance merging all the frames from the layers array at
   * the provided index.
   *
   * @param  {Array<Layer>} layers array of layers to use
   * @param  {Number} index frame index to merge
   * @return {Frame} Frame instance (can be a fake frame when using
   *         transparency)
   */
  mergeFrameAt(layers: Layer[], index: number): Frame | RenderedFrame {
    const isTransparent = layers.some(function (l) {
      return l.isTransparent();
    });
    if (isTransparent) {
      return LayerUtils.mergeTransparentFrameAt_(layers, index);
    } else {
      return LayerUtils.mergeOpaqueFrameAt_(layers, index);
    }
  },

  mergeTransparentFrameAt_(layers: Layer[], index: number): RenderedFrame {
    const hash = LayerUtils.getFrameHashAt(layers, index);
    const width = layers[0].frames[0].getWidth();
    const height = layers[0].frames[0].getHeight();
    const renderFn = function () {
      return LayerUtils.flattenFrameAt(layers, index, true);
    };
    return new RenderedFrame(renderFn, width, height, hash);
  },

  mergeOpaqueFrameAt_(layers: Layer[], index: number): Frame {
    const hash = LayerUtils.getFrameHashAt(layers, index);
    const frames = layers.map(function (l) {
      return l.getFrameAt(index);
    });
    const mergedFrame = assertDefined(FrameUtils.merge(frames), "mergedFrame");
    mergedFrame.id = hash;
    mergedFrame.version = 0;
    return mergedFrame;
  },

  renderFrameAt(
    layer: Layer,
    index: number,
    preserveOpacity: boolean
  ): HTMLCanvasElement {
    const opacity = preserveOpacity ? layer.getOpacity() : 1;
    const frame = layer.getFrameAt(index);
    return FrameUtils.toImage(frame, 1, opacity);
  },

  flattenFrameAt(
    layers: Layer[],
    index: number,
    preserveOpacity: boolean
  ): HTMLCanvasElement {
    const width = layers[0].getFrameAt(index).getWidth();
    const height = layers[0].getFrameAt(index).getHeight();
    const canvas = CanvasUtils.createCanvas(width, height);

    const context = assertDefined(canvas.getContext("2d"), "context");
    layers.forEach(function (l) {
      const render = LayerUtils.renderFrameAt(l, index, preserveOpacity);
      context.drawImage(render, 0, 0, width, height, 0, 0, width, height);
    });

    return canvas;
  }
};
