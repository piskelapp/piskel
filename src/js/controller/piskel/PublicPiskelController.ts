import { Events, type StateInfo } from "../../Events";
import { app } from "../../app";
import type { Frame } from "../../model/Frame";
import type { Layer } from "../../model/Layer";
import type { Piskel } from "../../model/Piskel";
import { HistoryService } from "../../service/HistoryService";
import { Shortcuts } from "../../service/keyboard/Shortcuts";
import { assertDefined } from "../../utils/core";
import type { PiskelController, SetPiskelOptions } from "./PiskelController";

/**
 * The PublicPiskelController is a decorator on PiskelController, provides the same API
 * but will fire RESET/SAVE events when appropriate so that other objects get notified
 * when important changes are made on the current Piskel.
 * @param {PiskelController} piskelController the wrapped PiskelController
 */
export class PublicPiskelController {
  piskelController: PiskelController;

  constructor(piskelController: PiskelController) {
    this.piskelController = piskelController;
  }

  init(): void {
    const shortcuts = Shortcuts;
    assertDefined(app.shortcutService, "shortcutService").registerShortcut(
      shortcuts.MISC.PREVIOUS_FRAME,
      this.selectPreviousFrame.bind(this)
    );
    assertDefined(app.shortcutService, "shortcutService").registerShortcut(
      shortcuts.MISC.NEXT_FRAME,
      this.selectNextFrame.bind(this)
    );
    assertDefined(app.shortcutService, "shortcutService").registerShortcut(
      shortcuts.MISC.NEW_FRAME,
      this.addFrameAtCurrentIndex.bind(this)
    );
    assertDefined(app.shortcutService, "shortcutService").registerShortcut(
      shortcuts.MISC.DUPLICATE_FRAME,
      this.duplicateCurrentFrame.bind(this)
    );
  }

  getWrappedPiskelController(): PiskelController {
    return this.piskelController;
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
    this.piskelController.setPiskel(piskel, options);

    $.publish(Events.FRAME_SIZE_CHANGED);
    $.publish(Events.PISKEL_RESET);

    if (!options || !options.noSnapshot) {
      $.publish(Events.PISKEL_SAVE_STATE, {
        type: HistoryService.SNAPSHOT
      });
    }
  }

  getStateInfo_(): { frameIndex: number; layerIndex: number } {
    const stateInfo = {
      frameIndex: this.piskelController.getCurrentFrameIndex(),
      layerIndex: this.piskelController.getCurrentLayerIndex()
    };
    return stateInfo;
  }

  raiseSaveStateEvent_(fn: () => void, stateInfo: StateInfo): void {
    $.publish(Events.PISKEL_SAVE_STATE, {
      type: HistoryService.REPLAY,
      scope: this,
      replay: {
        fn: fn
      },
      state: stateInfo
    });
  }

  replay(frame: Frame, replayData: { fn: () => void }): void {
    replayData.fn();
  }

  getHeight(): number {
    return this.piskelController.getHeight();
  }

  getWidth(): number {
    return this.piskelController.getWidth();
  }

  getFPS(): number {
    return this.piskelController.getFPS();
  }

  setFPS(fps: number): void {
    return this.piskelController.setFPS(fps);
  }

  getLayers(): Layer[] {
    return this.piskelController.getLayers();
  }

  getCurrentLayer(): Layer {
    return this.piskelController.getCurrentLayer();
  }

  getLayerAt(index: number): Layer {
    return this.piskelController.getLayerAt(index);
  }

  hasLayerAt(index: number): boolean {
    return this.piskelController.hasLayerAt(index);
  }

  getLayerByIndex(index: number): Layer | null {
    return this.piskelController.getLayerByIndex(index);
  }

  getCurrentFrame(): Frame {
    return this.piskelController.getCurrentFrame();
  }

  getCurrentLayerIndex(): number {
    return this.piskelController.getCurrentLayerIndex();
  }

  getCurrentFrameIndex(): number {
    return this.piskelController.getCurrentFrameIndex();
  }

  getPiskel(): Piskel {
    return this.piskelController.getPiskel();
  }

  isTransparent(): boolean {
    return this.piskelController.isTransparent();
  }

  renderFrameAt(index: number, preserveOpacity: boolean): HTMLCanvasElement {
    return this.piskelController.renderFrameAt(index, preserveOpacity);
  }

  hasFrameAt(index: number): boolean {
    return this.piskelController.hasFrameAt(index);
  }

  addFrame(): void {
    const stateInfo = this.getStateInfo_();
    this.piskelController.addFrame();
    this.raiseSaveStateEvent_(
      () => this.piskelController.addFrame(),
      stateInfo
    );
    $.publish(Events.PISKEL_RESET);
  }

  addFrameAtCurrentIndex(): void {
    const stateInfo = this.getStateInfo_();
    this.piskelController.addFrameAtCurrentIndex();
    this.raiseSaveStateEvent_(
      () => this.piskelController.addFrameAtCurrentIndex(),
      stateInfo
    );
    $.publish(Events.PISKEL_RESET);
  }

  addFrameAt(index: number): void {
    const stateInfo = this.getStateInfo_();
    this.piskelController.addFrameAt(index);
    this.raiseSaveStateEvent_(
      () => this.piskelController.addFrameAt(index),
      stateInfo
    );
    $.publish(Events.PISKEL_RESET);
  }

  onFrameAddedAt_(index: number): void {
    return this.piskelController.onFrameAddedAt_(index);
  }

  createEmptyFrame_(): Frame {
    return this.piskelController.createEmptyFrame_();
  }

  removeFrameAt(index: number): void {
    const stateInfo = this.getStateInfo_();
    this.piskelController.removeFrameAt(index);
    this.raiseSaveStateEvent_(
      () => this.piskelController.removeFrameAt(index),
      stateInfo
    );
    $.publish(Events.PISKEL_RESET);
  }

  duplicateCurrentFrame(): void {
    const stateInfo = this.getStateInfo_();
    this.piskelController.duplicateCurrentFrame();
    this.raiseSaveStateEvent_(
      () => this.piskelController.duplicateCurrentFrame(),
      stateInfo
    );
    $.publish(Events.PISKEL_RESET);
  }

  duplicateFrameAt(index: number): void {
    const stateInfo = this.getStateInfo_();
    this.piskelController.duplicateFrameAt(index);
    this.raiseSaveStateEvent_(
      () => this.piskelController.duplicateFrameAt(index),
      stateInfo
    );
    $.publish(Events.PISKEL_RESET);
  }

  toggleFrameVisibilityAt(index: number): void {
    const stateInfo = this.getStateInfo_();
    this.piskelController.toggleFrameVisibilityAt(index);
    this.raiseSaveStateEvent_(
      () => this.piskelController.toggleFrameVisibilityAt(index),
      stateInfo
    );
    $.publish(Events.PISKEL_RESET);
  }

  moveFrame(fromIndex: number, toIndex: number): void {
    const stateInfo = this.getStateInfo_();
    this.piskelController.moveFrame(fromIndex, toIndex);
    this.raiseSaveStateEvent_(
      () => this.piskelController.moveFrame(fromIndex, toIndex),
      stateInfo
    );
    $.publish(Events.PISKEL_RESET);
  }

  hasVisibleFrameAt(index: number): boolean {
    return this.piskelController.hasVisibleFrameAt(index);
  }

  getVisibleFrameIndexes(): number[] {
    return this.piskelController.getVisibleFrameIndexes();
  }

  getFrameCount(): number {
    return this.piskelController.getFrameCount();
  }

  setCurrentFrameIndex(index: number): void {
    this.piskelController.setCurrentFrameIndex(index);
    $.publish(Events.PISKEL_RESET);
  }

  selectNextFrame(): void {
    this.piskelController.selectNextFrame();
    $.publish(Events.PISKEL_RESET);
  }

  selectPreviousFrame(): void {
    this.piskelController.selectPreviousFrame();
    $.publish(Events.PISKEL_RESET);
  }

  setCurrentLayerIndex(index: number): void {
    this.piskelController.setCurrentLayerIndex(index);
    $.publish(Events.PISKEL_RESET);
  }

  selectLayer(layer: Layer): void {
    this.piskelController.selectLayer(layer);
    $.publish(Events.PISKEL_RESET);
  }

  renameLayerAt(index: number, name: string): void {
    const stateInfo = this.getStateInfo_();
    this.piskelController.renameLayerAt(index, name);
    this.raiseSaveStateEvent_(
      () => this.piskelController.renameLayerAt(index, name),
      stateInfo
    );
  }

  setLayerOpacityAt(index: number, opacity: number | string | null): void {
    const stateInfo = this.getStateInfo_();
    this.piskelController.setLayerOpacityAt(index, opacity);
    this.raiseSaveStateEvent_(
      () => this.piskelController.setLayerOpacityAt(index, opacity),
      stateInfo
    );
    $.publish(Events.PISKEL_RESET);
  }

  mergeDownLayerAt(index: number): void {
    const stateInfo = this.getStateInfo_();
    this.piskelController.mergeDownLayerAt(index);
    this.raiseSaveStateEvent_(
      () => this.piskelController.mergeDownLayerAt(index),
      stateInfo
    );
    $.publish(Events.PISKEL_RESET);
  }

  generateLayerName_(): string {
    return this.piskelController.generateLayerName_();
  }

  duplicateCurrentLayer(): void {
    const stateInfo = this.getStateInfo_();
    this.piskelController.duplicateCurrentLayer();
    this.raiseSaveStateEvent_(
      () => this.piskelController.duplicateCurrentLayer(),
      stateInfo
    );
    $.publish(Events.PISKEL_RESET);
  }

  createLayer(name?: string): void {
    const stateInfo = this.getStateInfo_();
    this.piskelController.createLayer(name);
    this.raiseSaveStateEvent_(
      () => this.piskelController.createLayer(name),
      stateInfo
    );
    $.publish(Events.PISKEL_RESET);
  }

  hasLayerForName_(name: string): boolean {
    return this.piskelController.hasLayerForName_(name);
  }

  moveLayerUp(toTop: boolean): void {
    const stateInfo = this.getStateInfo_();
    this.piskelController.moveLayerUp(toTop);
    this.raiseSaveStateEvent_(
      () => this.piskelController.moveLayerUp(toTop),
      stateInfo
    );
    $.publish(Events.PISKEL_RESET);
  }

  moveLayerDown(toBottom: boolean): void {
    const stateInfo = this.getStateInfo_();
    this.piskelController.moveLayerDown(toBottom);
    this.raiseSaveStateEvent_(
      () => this.piskelController.moveLayerDown(toBottom),
      stateInfo
    );
    $.publish(Events.PISKEL_RESET);
  }

  removeCurrentLayer(): void {
    const stateInfo = this.getStateInfo_();
    this.piskelController.removeCurrentLayer();
    this.raiseSaveStateEvent_(
      () => this.piskelController.removeCurrentLayer(),
      stateInfo
    );
    $.publish(Events.PISKEL_RESET);
  }

  removeLayerAt(index: number): void {
    return this.piskelController.removeLayerAt(index);
  }

  serialize(): string {
    return this.piskelController.serialize();
  }

  isEmpty(): boolean {
    return this.piskelController.isEmpty();
  }
}
