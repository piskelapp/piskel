import { Constants } from "../../../Constants";
import { app } from "../../../app";
import type { Piskel } from "../../../model/Piskel";
import { FramesheetRenderer } from "../../../rendering/FramesheetRenderer";
import { assertDefined } from "../../core";

/**
 * The array buffer serialization-deserialization should only be used when when backing
 * up the animation in memory. If you actually need to dump the animation to a string
 * use the regular serialization helpers.
 *
 * This is due to the lacking support on TypedArray::toString on some browsers.
 * Will revisit the option of using this across the whole project when the APIs are less
 * green.
 *
 *********
 *  META *
 *********
 * // Piskel
 * [0] = model version
 * [1] = width
 * [2] = height
 * [3] = fps
 *
 * // Descriptor
 * [4] = name length
 * [5] = description length
 *
 * // Layers
 * [6] = layers count
 * [layer data index start] = layer name length
 * [layer data index start + 1] = opacity
 * [layer data index start + 2] = frame count
 * [layer data index start + 3] = base 64 png data url length (upper 16 bits)
 * [layer data index start + 4] = base 64 png data url length (lower 16 bits)
 *
 *********
 *  DATA *
 *********
 * [7..name length-1] = name
 * [name length..description length-1] = description
 * [layer data index start + 4..layer name length-1] = layer name
 * [layer name length..base 64 png data url length-1] = base 64 png data url
 *
 */

type FrameData = { uri: string; length: number };

export const ArrayBufferSerializer = {
  calculateRequiredBytes(piskel: Piskel, framesData: FrameData[]): number {
    const descriptorNameLength = piskel.getDescriptor().name.length;
    const descriptorDescriptionLength =
      piskel.getDescriptor().description.length;

    let bytes = 0;

    /********/
    /* META */
    /********/
    // Piskel meta
    bytes += 4 * 2;

    // Descriptor meta
    bytes += 2 * 2;

    // Layers meta
    bytes += 1 * 2;

    /********/
    /* DATA */
    /********/
    // Descriptor name
    bytes += descriptorNameLength * 2;

    // Descriptor description
    bytes += descriptorDescriptionLength * 2;

    // Layers
    for (let i = 0, layers = piskel.getLayers(); i < layers.length; i++) {
      bytes += 5 * 2;
      bytes += layers[i].name.length * 2;
      bytes += framesData[i].length;
      if (bytes % 2 == 1) {
        bytes++;
      }
    }

    return bytes;
  },

  serialize(piskel: Piskel): ArrayBuffer {
    let i;
    let j;
    let layers;
    let dataUri;
    let dataUriLength;

    // Render frames
    const framesData: FrameData[] = [];
    for (i = 0, layers = piskel.getLayers(); i < layers.length; i++) {
      const renderer = new FramesheetRenderer(layers[i].getFrames());
      dataUri = renderer.renderAsCanvas().toDataURL().split(",")[1];
      dataUriLength = dataUri.length;
      framesData.push({ uri: dataUri, length: dataUriLength });
    }

    const hiddenFrames = piskel.hiddenFrames;
    const serializedHiddenFrames = hiddenFrames.join("-");

    const bytes = ArrayBufferSerializer.calculateRequiredBytes(
      piskel,
      framesData
    );

    const buffer = new ArrayBuffer(bytes);
    const arr8 = new Uint8Array(buffer);
    const arr16 = new Uint16Array(buffer);

    const width = piskel.getWidth();
    const height = piskel.getHeight();
    const descriptorName = piskel.getDescriptor().name;
    const descriptorNameLength = descriptorName.length;
    const descriptorDescription = piskel.getDescriptor().description;
    const descriptorDescriptionLength = descriptorDescription.length;

    /********/
    /* META */
    /********/
    // Piskel meta
    arr16[0] = Constants.MODEL_VERSION;
    arr16[1] = width;
    arr16[2] = height;
    arr16[3] = assertDefined(app.piskelController, "piskelController").getFPS();

    // Descriptor meta
    arr16[4] = descriptorNameLength;
    arr16[5] = descriptorDescriptionLength;

    // Layers meta
    arr16[6] = piskel.getLayers().length;

    // Frames meta
    arr16[7] = serializedHiddenFrames.length;

    let currentIndex = 8;

    /********/
    /* DATA */
    /********/
    // Descriptor name
    for (i = 0; i < descriptorNameLength; i++) {
      arr16[currentIndex + i] = descriptorName.charCodeAt(i);
    }
    currentIndex = currentIndex + descriptorNameLength;

    // Descriptor description
    for (i = 0; i < descriptorDescriptionLength; i++) {
      arr16[currentIndex + i] = descriptorDescription.charCodeAt(i);
    }
    currentIndex = currentIndex + descriptorDescriptionLength;

    // Hidden frames
    for (i = 0; i < serializedHiddenFrames.length; i++) {
      arr16[currentIndex + i] = serializedHiddenFrames.charCodeAt(i);
    }
    currentIndex = currentIndex + serializedHiddenFrames.length;

    // Layers
    for (i = 0, layers = piskel.getLayers(); i < layers.length; i++) {
      const layer = layers[i];
      const frames = layer.getFrames();

      const layerName = layer.getName();
      const layerNameLength = layerName.length;
      const opacity = layer.getOpacity();
      const frameCount = frames.length;

      dataUri = framesData[i].uri;
      dataUriLength = framesData[i].length;

      // Meta
      arr16[currentIndex] = layerNameLength;
      arr16[currentIndex + 1] = Math.floor(opacity * 65535);
      arr16[currentIndex + 2] = frameCount;
      arr16[currentIndex + 3] = ((dataUriLength & 0xffff0000) >> 16) >>> 0; // Upper 16
      arr16[currentIndex + 4] = (dataUriLength & 0x0000ffff) >>> 0; // Lower 16

      // Name
      for (j = 0; j < layerNameLength; j++) {
        arr16[currentIndex + 5 + j] = layerName.charCodeAt(j);
      }

      // Data URI
      for (j = 0; j < dataUriLength; j++) {
        arr8[(currentIndex + 5 + layerNameLength) * 2 + j] =
          dataUri.charCodeAt(j);
      }

      currentIndex += Math.ceil(5 + layerNameLength + dataUriLength / 2);
    }

    return buffer;
  }
};
