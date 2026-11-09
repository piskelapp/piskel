import type { Piskel } from "../../model/Piskel";
import { BlobUtils } from "../../utils/BlobUtils";
import { DateUtils } from "../../utils/DateUtils";
import { FileUtils } from "../../utils/FileUtils";
import { Serializer } from "../../utils/serialization/Serializer";

export class FileDownloadStorageService {
  init(): void {}

  save(piskel: Piskel): Promise<void> {
    const serialized = Serializer.serialize(piskel);

    return new Promise<void>((resolve, reject) => {
      BlobUtils.stringToBlob(
        serialized,
        (blob: Blob) => {
          const piskelName = piskel.getDescriptor().name;
          const timestamp = DateUtils.format(
            new Date(),
            "{{Y}}{{M}}{{D}}-{{H}}{{m}}{{s}}"
          );
          const fileName = piskelName + "-" + timestamp + ".piskel";

          try {
            FileUtils.downloadAsFile(blob, fileName);
            resolve();
          } catch (e) {
            reject(e instanceof Error ? e.message : String(e));
          }
        },
        "application/piskel+json"
      );
    });
  }
}
