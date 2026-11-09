import { Events } from "../../Events";
import { app } from "../../app";
import { Frame } from "../../model/Frame";
import { Layer } from "../../model/Layer";
import type { Piskel } from "../../model/Piskel";
import { LayerUtils } from "../../utils/LayerUtils";
import { assertDefined } from "../../utils/core";
import { Serializer } from "../../utils/serialization/Serializer";

export type SetPiskelOptions = {
  preserveState?: boolean;
  noSnapshot?: boolean;
};

export class PiskelController {
  piskel: Piskel | undefined;
  currentLayerIndex: number | undefined;
  currentFrameIndex: number | undefined;
  layerIdCounter: number | undefined;

  constructor(piskel: Piskel) {
    if (piskel) {
      this.setPiskel(piskel);
    } else {
      throw "A piskel instance is mandatory for instanciating PiskelController";
    }
  }

  /**
   * Set the current piskel. Will reset the selected frame and layer unless specified
   * @param {Object} piskel
   * @param {Object} options:
   *                 preserveState {Boolean} if true, keep the selected frame and layer
   *                 noSnapshot {Boolean} if true, do not save a snapshot in the piskel
   *                            history for this call to setPiskel
   */
  setPiskel(piskel: Piskel, options?: SetPiskelOptions): void {
    this.piskel = piskel;
    if (!options || !options.preserveState) {
      this.currentLayerIndex = 0;
      this.currentFrameIndex = 0;
    }

    this.layerIdCounter = 1;
  }

  init(): void {}

  getHeight(): number {
    return assertDefined(this.piskel, "piskel").getHeight();
  }

  getWidth(): number {
    return assertDefined(this.piskel, "piskel").getWidth();
  }

  getFPS(): number {
    return assertDefined(this.piskel, "piskel").fps;
  }

  setFPS(fps: number): void {
    if (typeof fps !== "number") {
      return;
    }
    assertDefined(this.piskel, "piskel").fps = fps;
    $.publish(Events.FPS_CHANGED);
  }

  getLayers(): Layer[] {
    return assertDefined(this.piskel, "piskel").getLayers();
  }

  getCurrentLayer(): Layer {
    return this.getLayerAt(
      assertDefined(this.currentLayerIndex, "currentLayerIndex")
    );
  }

  getLayerAt(index: number): Layer {
    return assertDefined(this.piskel, "piskel").getLayerAt(index);
  }

  hasLayerAt(index: number): boolean {
    return !!this.getLayerAt(index);
  }

  // FIXME ?? No added value compared to getLayerAt ??
  // Except normalizing to null if undefined ?? ==> To merge
  getLayerByIndex(index: number): Layer | null {
    const layers = this.getLayers();
    if (layers[index]) {
      return layers[index];
    } else {
      return null;
    }
  }

  getCurrentFrame(): Frame {
    const layer = this.getCurrentLayer();
    return layer.getFrameAt(
      assertDefined(this.currentFrameIndex, "currentFrameIndex")
    );
  }

  getCurrentLayerIndex(): number {
    return assertDefined(this.currentLayerIndex, "currentLayerIndex");
  }

  getCurrentFrameIndex(): number {
    return assertDefined(this.currentFrameIndex, "currentFrameIndex");
  }

  getPiskel(): Piskel {
    return assertDefined(this.piskel, "piskel");
  }

  isTransparent(): boolean {
    return this.getLayers().some(function (l) {
      return l.isTransparent();
    });
  }

  renderFrameAt(index: number, preserveOpacity: boolean): HTMLCanvasElement {
    return LayerUtils.flattenFrameAt(this.getLayers(), index, preserveOpacity);
  }

  hasFrameAt(index: number): boolean {
    return !!this.getCurrentLayer().getFrameAt(index);
  }

  addFrame(): void {
    this.addFrameAt(this.getFrameCount());
  }

  addFrameAtCurrentIndex(): void {
    this.addFrameAt(this.getCurrentFrameIndex() + 1);
  }

  addFrameAt(index: number): void {
    this.getLayers().forEach((l) => {
      l.addFrameAt(this.createEmptyFrame_(), index);
    });

    this.onFrameAddedAt_(index);
  }

  onFrameAddedAt_(index: number): void {
    assertDefined(this.piskel, "piskel").hiddenFrames = assertDefined(
      this.piskel,
      "piskel"
    ).hiddenFrames.map(function (hiddenIndex: number) {
      if (hiddenIndex >= index) {
        return hiddenIndex + 1;
      }
      return hiddenIndex;
    });

    this.setCurrentFrameIndex(index);
  }

  createEmptyFrame_(): Frame {
    const w = assertDefined(this.piskel, "piskel").getWidth();
    const h = assertDefined(this.piskel, "piskel").getHeight();
    return new Frame(w, h);
  }

  removeFrameAt(index: number): void {
    this.getLayers().forEach(function (l) {
      l.removeFrameAt(index);
    });

    // Update the array of hidden frames since some hidden indexes might have shifted.
    assertDefined(this.piskel, "piskel").hiddenFrames = assertDefined(
      this.piskel,
      "piskel"
    ).hiddenFrames.map(function (hiddenIndex: number) {
      if (hiddenIndex > index) {
        return hiddenIndex - 1;
      }
      return hiddenIndex;
    });

    // Current frame index is impacted if the removed frame was before the current frame
    const currentFrameIndex = this.getCurrentFrameIndex();
    if (currentFrameIndex >= index && currentFrameIndex > 0) {
      this.setCurrentFrameIndex(currentFrameIndex - 1);
    }
  }

  duplicateCurrentFrame(): void {
    this.duplicateFrameAt(
      assertDefined(this.currentFrameIndex, "currentFrameIndex")
    );
  }

  duplicateFrameAt(index: number): void {
    this.getLayers().forEach(function (l) {
      l.duplicateFrameAt(index);
    });
    this.onFrameAddedAt_(index + 1);
  }

  /**
   * Toggle frame visibility for the frame at the provided index.
   * A visible frame will be included in the animated preview.
   */
  toggleFrameVisibilityAt(index: number): void {
    let hiddenFrames = assertDefined(this.piskel, "piskel").hiddenFrames;
    if (hiddenFrames.indexOf(index) === -1) {
      hiddenFrames.push(index);
    } else {
      hiddenFrames = hiddenFrames.filter(function (i) {
        return i !== index;
      });
    }

    // Keep the hiddenFrames array sorted.
    assertDefined(this.piskel, "piskel").hiddenFrames = hiddenFrames.sort();
  }

  moveFrame(fromIndex: number, toIndex: number): void {
    this.getLayers().forEach(function (l) {
      l.moveFrame(fromIndex, toIndex);
    });

    // Update the array of hidden frames since some hidden indexes might have shifted.
    assertDefined(this.piskel, "piskel").hiddenFrames = assertDefined(
      this.piskel,
      "piskel"
    ).hiddenFrames.map(function (index: number): number {
      if (index === fromIndex) {
        return toIndex;
      }

      // All the frames between fromIndex and toIndex changed their index.
      const isImpacted =
        index >= Math.min(fromIndex, toIndex) &&
        index <= Math.max(fromIndex, toIndex);
      if (isImpacted) {
        if (fromIndex < toIndex) {
          // If the frame moved to a higher index, all impacted frames had their index
          // reduced by 1.
          return index - 1;
        } else {
          // Otherwise, they had their index increased by 1.
          return index + 1;
        }
      }
      return index;
    });
  }

  hasVisibleFrameAt(index: number): boolean {
    return (
      assertDefined(this.piskel, "piskel").hiddenFrames.indexOf(index) === -1
    );
  }

  getVisibleFrameIndexes(): number[] {
    return this.getCurrentLayer()
      .getFrames()
      .map(function (frame: Frame, index: number) {
        return index;
      })
      .filter((index: number) => {
        return (
          assertDefined(this.piskel, "piskel").hiddenFrames.indexOf(index) ===
          -1
        );
      });
  }

  getFrameCount(): number {
    return assertDefined(this.piskel, "piskel").getFrameCount();
  }

  setCurrentFrameIndex(index: number): void {
    if (this.hasFrameAt(index)) {
      this.currentFrameIndex = index;
    } else {
      window.console.error("Could not set current frame index to " + index);
    }
  }

  selectNextFrame(): void {
    const nextIndex = this.getCurrentFrameIndex() + 1;
    if (nextIndex < this.getFrameCount()) {
      this.setCurrentFrameIndex(nextIndex);
    }
  }

  selectPreviousFrame(): void {
    const nextIndex = this.getCurrentFrameIndex() - 1;
    if (nextIndex >= 0) {
      this.setCurrentFrameIndex(nextIndex);
    }
  }

  setCurrentLayerIndex(index: number): void {
    if (this.hasLayerAt(index)) {
      this.currentLayerIndex = index;
    } else {
      window.console.error("Could not set current layer index to " + index);
    }
  }

  selectLayer(layer: Layer): void {
    const index = this.getLayers().indexOf(layer);
    if (index != -1) {
      this.setCurrentLayerIndex(index);
    }
  }

  renameLayerAt(index: number, name: string): void {
    const layer = this.getLayerByIndex(index);
    if (layer) {
      layer.setName(name);
    }
  }

  setLayerOpacityAt(index: number, opacity: number | string | null): void {
    const layer = this.getLayerByIndex(index);
    if (layer) {
      layer.setOpacity(opacity);
    }
  }

  mergeDownLayerAt(index: number): void {
    const layer = this.getLayerByIndex(index);
    const downLayer = this.getLayerByIndex(index - 1);
    if (layer && downLayer) {
      const mergedLayer = LayerUtils.mergeLayers(layer, downLayer);
      this.removeLayerAt(index);
      assertDefined(this.piskel, "piskel").addLayerAt(mergedLayer, index);
      this.removeLayerAt(index - 1);
      this.selectLayer(mergedLayer);
    }
  }

  generateLayerName_(): string {
    let name = "Layer " + this.layerIdCounter;
    while (this.hasLayerForName_(name)) {
      this.layerIdCounter =
        assertDefined(this.layerIdCounter, "layerIdCounter") + 1;
      name = "Layer " + this.layerIdCounter;
    }
    return name;
  }

  duplicateCurrentLayer(): void {
    const layer = this.getCurrentLayer();
    const clone = LayerUtils.clone(layer);
    const currentLayerIndex = this.getCurrentLayerIndex();
    assertDefined(this.piskel, "piskel").addLayerAt(
      clone,
      currentLayerIndex + 1
    );
    this.setCurrentLayerIndex(currentLayerIndex + 1);
  }

  createLayer(name?: string): void {
    if (!name) {
      name = this.generateLayerName_();
    }
    if (!this.hasLayerForName_(name)) {
      const layer = new Layer(name);
      for (let i = 0; i < this.getFrameCount(); i++) {
        layer.addFrame(this.createEmptyFrame_());
      }
      const currentLayerIndex = this.getCurrentLayerIndex();
      assertDefined(this.piskel, "piskel").addLayerAt(
        layer,
        currentLayerIndex + 1
      );
      this.setCurrentLayerIndex(currentLayerIndex + 1);
    } else {
      throw "Layer name should be unique";
    }
  }

  hasLayerForName_(name: string): boolean {
    return (
      assertDefined(this.piskel, "piskel").getLayersByName(name).length > 0
    );
  }

  moveLayerUp(toTop: boolean): void {
    const layer = this.getCurrentLayer();
    assertDefined(this.piskel, "piskel").moveLayerUp(layer, toTop);
    this.selectLayer(layer);
  }

  moveLayerDown(toBottom: boolean): void {
    const layer = this.getCurrentLayer();
    assertDefined(this.piskel, "piskel").moveLayerDown(layer, toBottom);
    this.selectLayer(layer);
  }

  removeCurrentLayer(): void {
    const currentLayerIndex = this.getCurrentLayerIndex();
    this.removeLayerAt(currentLayerIndex);
  }

  removeLayerAt(index: number): void {
    if (!this.hasLayerAt(index)) {
      return;
    }

    const layer = this.getLayerAt(index);
    assertDefined(this.piskel, "piskel").removeLayer(layer);

    // Update the selected layer if needed.
    if (this.getCurrentLayerIndex() === index) {
      this.setCurrentLayerIndex(Math.max(0, index - 1));
    }
  }

  serialize(): string {
    return Serializer.serialize(assertDefined(this.piskel, "piskel"));
  }

  /**
   * Check if the current sprite is empty. Emptiness here means no pixel has been filled
   * on any layer or frame for the current sprite.
   */
  isEmpty(): boolean {
    return (
      assertDefined(
        app.currentColorsService,
        "currentColorsService"
      ).getCurrentColors().length === 0
    );
  }
}
