import { Frame } from "../model/Frame";
import { Layer } from "../model/Layer";
import type { Piskel } from "../model/Piskel";
import { ResizeUtils } from "./ResizeUtils";

export type MergeOptions = {
  resize: string | null;
  origin: string;
  insertMode: string | null;
  insertIndex: number | null | undefined;
};

export const MergeUtils = {
  /**
   * Merge two piskel instances in a new piskel instance
   * @param  {Piskel} piskel
   *         The original piskel (name and description will be preserved)
   * @param  {Piskel} importedPiskel
   *         The imported piskel
   * @param  {Object} options
   *         - index: {Number} index where the new frames should be appended
   *         - resize: {String} either "expand" or "keep"
   *         - origin: {String} can be any of the existing AnchorWidget origins.
   *         - insertMode: {String} either "insert" or "add"
   *
   * @return {Piskel} The new Piskel instance created
   */
  merge(piskel: Piskel, importedPiskel: Piskel, options: MergeOptions): Piskel {
    const isImportedPiskelBigger =
      importedPiskel.getWidth() > piskel.getWidth() ||
      importedPiskel.getHeight() > piskel.getHeight();

    // First make sure both the piskel and the imported piskel use the target dimensions.
    if (isImportedPiskelBigger && options.resize === "expand") {
      piskel = ResizeUtils.resizePiskel(piskel, {
        width: Math.max(piskel.getWidth(), importedPiskel.getWidth()),
        height: Math.max(piskel.getHeight(), importedPiskel.getHeight()),
        origin: options.origin,
        resizeContent: false
      });
    } else {
      importedPiskel = ResizeUtils.resizePiskel(importedPiskel, {
        width: piskel.getWidth(),
        height: piskel.getHeight(),
        origin: options.origin,
        resizeContent: false
      });
    }

    let insertIndex = Number(options.insertIndex);
    if (options.insertMode === "insert") {
      // The index provided by the frame picker is 1-based.
      // When adding new frames, this works out fine, but if we want to
      // insert the new content in existing frames, we need to get the real
      // 0-based index of the selected frame.
      insertIndex = insertIndex - 1;
    }
    // Add necessary frames in the original piskel.
    const importedFrameCount = importedPiskel.getFrameCount();
    for (let i = 0; i < importedFrameCount; i++) {
      const index = i + insertIndex;
      // For a given index, a new frame should be added either if we are using "add" insert mode
      // or if the current index is not supported by the original piskel.
      if (options.insertMode === "add" || index >= piskel.getFrameCount()) {
        MergeUtils.addFrameToLayers_(piskel, index);
      }
    }

    // Import the layers in the original piskel.
    importedPiskel.getLayers().forEach(function (layer: Layer) {
      const name = layer.getName() + " (imported)";
      const importedLayer = new Layer(name);
      for (let i = 0; i < piskel.getFrameCount(); i++) {
        const importedIndex = i - insertIndex;
        let frame = layer.getFrameAt(importedIndex);
        if (!frame) {
          frame = MergeUtils.createEmptyFrame_(piskel);
        }

        importedLayer.addFrame(frame);
      }
      piskel.addLayer(importedLayer);
    });

    return piskel;
  },

  createEmptyFrame_(piskel: Piskel): Frame {
    return new Frame(piskel.getWidth(), piskel.getHeight());
  },

  addFrameToLayers_(piskel: Piskel, index: number): void {
    piskel.getLayers().forEach(function (l) {
      l.addFrameAt(MergeUtils.createEmptyFrame_(piskel), index);
    });
  }
};
