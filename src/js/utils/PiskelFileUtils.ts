import type { Piskel } from "../model/Piskel";
import { Base64 } from "./Base64";
import { Environment } from "./Environment";
import { FileUtils } from "./FileUtils";
import {
  Deserializer,
  type SerializedData
} from "./serialization/Deserializer";

export const PiskelFileUtils = {
  FAILURE: {
    EMPTY: "No data found in piskel file",
    INVALID: "Invalid piskel file, contact us on twitter @piskelapp",
    DESERIALIZATION: "Piskel data deserialization failed"
  },

  /**
   * Load a piskel from a piskel file.
   * After deserialization is successful, the provided success callback will be called.
   * Success callback is expected to receive a single Piskel object argument
   * @param  {File} file the .piskel file to load
   * @param  {Function} onSuccess Called if the deserialization of the piskel is successful
   * @param  {Function} onError NOT USED YET
   */
  loadFromFile(
    file: File,
    onSuccess: (piskel: Piskel) => void,
    onError: (reason: string) => void
  ): void {
    FileUtils.readFile(file, function (content: string) {
      const rawPiskel = Base64.toText(content);
      PiskelFileUtils.decodePiskelFile(
        rawPiskel,
        function (piskel: Piskel) {
          // if using Node-Webkit, store the savePath on load
          // Note: the 'path' property is unique to Node-Webkit, and holds the full path
          if (Environment.detectNodeWebkit()) {
            piskel.savePath = (file as File & { path: string }).path;
          }
          onSuccess(piskel);
        },
        onError
      );
    });
  },

  decodePiskelFile(
    rawPiskel: string,
    onSuccess: (piskel: Piskel) => void,
    onError: (reason: string) => void
  ): void {
    let serializedPiskel: SerializedData;
    if (rawPiskel.length === 0) {
      onError(PiskelFileUtils.FAILURE.EMPTY);
      return;
    }

    try {
      serializedPiskel = JSON.parse(rawPiskel);
    } catch (_e) {
      onError(PiskelFileUtils.FAILURE.INVALID);
      return;
    }

    Deserializer.deserialize(serializedPiskel, onSuccess, function () {
      onError(PiskelFileUtils.FAILURE.DESERIALIZATION);
    });
  }
};
