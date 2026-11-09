import { app } from "../app";
import type { Frame } from "../model/Frame";
import type { Layer } from "../model/Layer";
import { assertDefined } from "../utils/core";

export const ToolsHelper = {
  /**
   * Retrieve a list of frames containing either :
   * - only the current frame (useAllLayers = false, useAllFrames = false)
   * - only the frames of the current layer (useAllLayers = false, useAllFrames = true)
   * - only the frames at the currentIndex in each layer  (useAllLayers = true, useAllFrames = false)
   * - all frames  (useAllLayers = true, useAllFrames = true)
   *
   * @param  {Boolean} useAllLayers true if frames from all layers should be returned
   * @param  {Boolean} useAllFrames true if frames at any index should be returned
   * @return {Array[Frame]} list of Frame instances, can be empty
   */
  getTargetFrames(useAllLayers: boolean, useAllFrames: boolean): Frame[] {
    const currentFrameIndex = assertDefined(
      app.piskelController,
      "piskelController"
    ).getCurrentFrameIndex();
    const layers = useAllLayers
      ? assertDefined(app.piskelController, "piskelController").getLayers()
      : [
          assertDefined(
            app.piskelController,
            "piskelController"
          ).getCurrentLayer()
        ];
    return layers.reduce(function (previous: Frame[], layer: Layer) {
      const frames = useAllFrames
        ? layer.getFrames()
        : [layer.getFrameAt(currentFrameIndex)];
      return previous.concat(frames);
    }, []);
  }
};
