import { Constants } from "../../Constants";
import { app } from "../../app";
import type { Frame } from "../../model/Frame";
import type { Layer } from "../../model/Layer";
import type { Piskel } from "../../model/Piskel";
import { FramesheetRenderer } from "../../rendering/FramesheetRenderer";
import { ArrayUtils } from "../Array";
import { assertDefined } from "../core";
import type { LayerChunk, SerializedLayer } from "./Deserializer";

const areChunksValid = function (chunks: LayerChunk[]): boolean {
  return (
    chunks.length > 0 &&
    chunks.every(function (chunk: LayerChunk) {
      return Boolean(chunk.base64PNG) && chunk.base64PNG !== "data:,";
    })
  );
};

const createLineLayout = function (size: number, offset: number): number[][] {
  const layout: number[][] = [];
  for (let i = 0; i < size; i++) {
    layout.push([i + offset]);
  }

  return layout;
};

export const Serializer = {
  serialize(piskel: Piskel): string {
    const serializedLayers = piskel.getLayers().map(function (l) {
      return Serializer.serializeLayer(l);
    });

    return JSON.stringify({
      modelVersion: Constants.MODEL_VERSION,
      piskel: {
        name: piskel.getDescriptor().name,
        description: piskel.getDescriptor().description,
        fps: assertDefined(app.piskelController, "piskelController").getFPS(),
        height: piskel.getHeight(),
        width: piskel.getWidth(),
        layers: serializedLayers,
        hiddenFrames: piskel.hiddenFrames
      }
    });
  },

  serializeLayer(layer: Layer): string {
    const frames = layer.getFrames();
    const layerToSerialize: SerializedLayer = {
      name: layer.getName(),
      opacity: layer.getOpacity(),
      frameCount: frames.length
    };

    // A layer spritesheet data can be chunked in case the spritesheet PNG is to big to be
    // converted to a dataURL.
    // Frames are divided equally amongst chunks and each chunk is converted to a spritesheet
    // PNG. If any chunk contains an invalid base64 PNG, we increase the number of chunks and
    // retry.
    let chunks: LayerChunk[] = [];
    while (!areChunksValid(chunks)) {
      if (chunks.length >= frames.length) {
        // Something went horribly wrong.
        chunks = [];
        break;
      }

      // Chunks are invalid, increase the number of chunks by one, and chunk the frames array.
      const frameChunks = ArrayUtils.chunk(frames, chunks.length + 1);

      // Reset chunks array.
      chunks = [];

      // After each chunk update the offset by te number of frames that have been processed.
      let offset = 0;
      for (let i = 0; i < frameChunks.length; i++) {
        const chunkFrames = frameChunks[i];
        chunks.push({
          // create a layout array, containing the indices of the frames extracted in this chunk
          layout: createLineLayout(chunkFrames.length, offset),
          base64PNG: Serializer.serializeFramesToBase64(chunkFrames)
        });

        offset += chunkFrames.length;
      }
    }

    layerToSerialize.chunks = chunks;
    return JSON.stringify(layerToSerialize);
  },

  serializeFramesToBase64(frames: Frame[]): string {
    try {
      const renderer = new FramesheetRenderer(frames);
      return renderer.renderAsCanvas().toDataURL();
    } catch {
      return "";
    }
  }
};
