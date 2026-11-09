import { Events } from "../Events";
import { MathUtils } from "../utils/Math";
import type { Layer } from "./Layer";
import type { Descriptor } from "./piskel/Descriptor";

/**
 * @constructor
 * @param {Number} width
 * @param {Number} height
 * @param {String} name
 * @param {String} description
 */
export class Piskel {
  layers: Layer[];
  width: number;
  height: number;
  descriptor: Descriptor;
  savePath: string | null;
  fps: number;
  hiddenFrames: number[];

  constructor(
    width: number,
    height: number,
    fps: number,
    descriptor: Descriptor
  ) {
    if (width && height && descriptor) {
      this.layers = [];
      this.width = width;
      this.height = height;
      this.descriptor = descriptor;
      this.savePath = null;
      this.fps = fps;
      this.hiddenFrames = [];
    } else {
      throw (
        "Missing arguments in Piskel constructor : " +
        [width, height, fps, descriptor].join(",")
      );
    }
  }

  /**
   * Create a piskel instance from an existing set of (non empty) layers
   * Layers should all be synchronized : same number of frames, same dimensions
   * @param  {Array<pskl.model.Layer>} layers
   * @return {pskl.model.Piskel}
   */
  static fromLayers(
    layers: Layer[],
    fps: number,
    descriptor: Descriptor
  ): Piskel {
    let piskel = null;
    if (layers.length > 0 && layers[0].size() > 0) {
      const sampleFrame = layers[0].getFrameAt(0);
      piskel = new Piskel(
        sampleFrame.getWidth(),
        sampleFrame.getHeight(),
        fps,
        descriptor
      );
      layers.forEach(piskel.addLayer.bind(piskel));
    } else {
      throw "Piskel.fromLayers expects array of non empty pskl.model.Layer as first argument";
    }
    return piskel;
  }

  getHeight(): number {
    return this.height;
  }

  getWidth(): number {
    return this.width;
  }

  getFPS(): number {
    return this.fps;
  }

  getLayers(): Layer[] {
    return this.layers;
  }

  getLayerAt(index: number): Layer {
    return this.layers[index];
  }

  getLayersByName(name: string): Layer[] {
    return this.layers.filter(function (l) {
      return l.getName() == name;
    });
  }

  getFrameCount(): number {
    return this.getLayerAt(0).size();
  }

  addLayer(layer: Layer): void {
    this.layers.push(layer);
  }

  addLayerAt(layer: Layer, index: number): void {
    this.layers.splice(index, 0, layer);
  }

  moveLayerUp(layer: Layer, toTop: boolean): void {
    const index = this.layers.indexOf(layer);
    const toIndex = toTop ? this.layers.length - 1 : index + 1;
    this.moveLayer_(index, toIndex);
  }

  moveLayerDown(layer: Layer, toBottom: boolean): void {
    const index = this.layers.indexOf(layer);
    const toIndex = toBottom ? 0 : index - 1;
    this.moveLayer_(index, toIndex);
  }

  /**
   * Move the layer at the provided index to the provided toIndex.
   */
  moveLayer_(fromIndex: number, toIndex: number): void {
    if (fromIndex == -1 || toIndex == -1 || fromIndex == toIndex) {
      return;
    }
    toIndex = MathUtils.minmax(toIndex, 0, this.layers.length - 1);
    const layer = this.layers.splice(fromIndex, 1)[0];
    this.layers.splice(toIndex, 0, layer);
  }

  removeLayer(layer: Layer): void {
    const index = this.layers.indexOf(layer);
    if (index != -1) {
      this.layers.splice(index, 1);
    }
  }

  removeLayerAt(index: number): void {
    this.layers.splice(index, 1);
  }

  getDescriptor(): Descriptor {
    return this.descriptor;
  }

  setDescriptor(descriptor: Descriptor): void {
    this.descriptor = descriptor;
    $.publish(Events.PISKEL_DESCRIPTOR_UPDATED);
  }

  setName(name: string): void {
    this.descriptor.name = name;
    $.publish(Events.PISKEL_DESCRIPTOR_UPDATED);
  }

  getHash(): string {
    return this.layers
      .map(function (layer: Layer) {
        return layer.getHash();
      })
      .join("-");
  }
}
