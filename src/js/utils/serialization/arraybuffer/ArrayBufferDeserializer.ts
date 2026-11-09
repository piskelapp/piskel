import type { Frame } from "../../../model/Frame";
import { Layer } from "../../../model/Layer";
import { Piskel } from "../../../model/Piskel";
import { Descriptor } from "../../../model/piskel/Descriptor";
import { FrameUtils } from "../../FrameUtils";

/**
 * The array buffer serialization-deserialization should only be used when when backing
 * up the animation in memory. If you actually need to dump the animation to a string
 * use the regular serialization helpers.
 *
 * This is due to the lacking support on TypedArray::toString on some browsers.
 * Will revisit the option of using this across the whole project when the APIs are less
 * green.
 *
 */
type ArrayBufferLayer = {
  name: string;
  opacity: number;
  frameCount: number;
  dataUri: string;
};

export const ArrayBufferDeserializer = {
  deserialize(data: ArrayBuffer, callback: (piskel: Piskel) => void): void {
    let i;
    let j;
    const buffer = data;
    const arr8 = new Uint8Array(buffer);
    const arr16 = new Uint16Array(arr8.buffer);

    /********/
    /* META */
    /********/
    // Piskel meta
    // var _modelVersion = arr16[0];
    const width = arr16[1];
    const height = arr16[2];
    const fps = arr16[3];

    // Descriptor meta
    const descriptorNameLength = arr16[4];
    const descriptorDescriptionLength = arr16[5];

    // Layers meta
    const layerCount = arr16[6];

    // Layers meta
    const serializedHiddenFramesLength = arr16[7];

    let currentIndex = 8;
    /********/
    /* DATA */
    /********/
    // Descriptor name
    let descriptorName = "";
    for (i = 0; i < descriptorNameLength; i++) {
      descriptorName += String.fromCharCode(arr16[currentIndex + i]);
    }
    currentIndex += descriptorNameLength;

    // Descriptor description
    let descriptorDescription = "";
    for (i = 0; i < descriptorDescriptionLength; i++) {
      descriptorDescription = String.fromCharCode(
        arr16[8 + descriptorNameLength + i]
      );
    }
    currentIndex += descriptorDescriptionLength;

    // Hidden frames
    let serializedHiddenFrames = "";
    for (i = 0; i < serializedHiddenFramesLength; i++) {
      serializedHiddenFrames = String.fromCharCode(
        arr16[8 + descriptorNameLength + i]
      );
    }
    const hiddenFrames = serializedHiddenFrames.split("-");
    currentIndex += serializedHiddenFramesLength;

    // Layers
    const layers: ArrayBufferLayer[] = [];
    for (i = 0; i < layerCount; i++) {
      // Meta
      const layerNameLength = arr16[currentIndex];
      const opacity = arr16[currentIndex + 1] / 65535;
      const frameCount = arr16[currentIndex + 2];
      const dataUriLengthFirstHalf = arr16[currentIndex + 3];
      const dataUriLengthSecondHalf = arr16[currentIndex + 4];
      const dataUriLength =
        (dataUriLengthSecondHalf >>> 0) |
        ((dataUriLengthFirstHalf << 16) >>> 0);

      // Name
      let layerName = "";
      for (j = 0; j < layerNameLength; j++) {
        layerName += String.fromCharCode(arr16[currentIndex + 5 + j]);
      }

      // Data URI
      let dataUri = "";
      for (j = 0; j < dataUriLength; j++) {
        dataUri += String.fromCharCode(
          arr8[(currentIndex + 5 + layerNameLength) * 2 + j]
        );
      }
      dataUri = "data:image/png;base64," + dataUri;

      currentIndex += Math.ceil(5 + layerNameLength + dataUriLength / 2);

      layers.push({
        name: layerName,
        opacity: opacity,
        frameCount: frameCount,
        dataUri: dataUri
      });
    }

    const descriptor = new Descriptor(descriptorName, descriptorDescription);
    const piskel = new Piskel(width, height, fps, descriptor);
    // This format restores the hidden frames as strings.
    Reflect.set(piskel, "hiddenFrames", hiddenFrames);
    let loadedLayers = 0;

    const loadLayerImage = function (
      layer: ArrayBufferLayer,
      model: Layer,
      cb: (arg0: Piskel) => void
    ) {
      const image = new Image();
      image.onload = function () {
        const frames = FrameUtils.createFramesFromSpritesheet(
          image,
          layer.frameCount
        );
        frames.forEach(function (frame: Frame) {
          model.addFrame(frame);
        });

        loadedLayers++;
        if (loadedLayers == layerCount) {
          cb(piskel);
        }
      };
      image.src = layer.dataUri;
    };

    for (i = 0; i < layerCount; i++) {
      const layer = layers[i];
      const nlayer = new Layer(layer.name);
      nlayer.setOpacity(layer.opacity);
      piskel.addLayer(nlayer);

      loadLayerImage(layer, nlayer, callback);
    }
  }
};
