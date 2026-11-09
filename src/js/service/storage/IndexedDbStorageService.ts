import { app } from "../../app";
import type { PublicPiskelController } from "../../controller/piskel/PublicPiskelController";
import {
  PiskelDatabase,
  type SavedPiskelInfo
} from "../../database/PiskelDatabase";
import type { Piskel } from "../../model/Piskel";
import { assertDefined } from "../../utils/core";
import { Deserializer } from "../../utils/serialization/Deserializer";
import { Serializer } from "../../utils/serialization/Serializer";

export class IndexedDbStorageService {
  piskelController: PublicPiskelController;
  piskelDatabase: PiskelDatabase;

  constructor(piskelController: PublicPiskelController) {
    this.piskelController = piskelController;
    this.piskelDatabase = new PiskelDatabase();
  }

  init(): void {
    this.piskelDatabase.init().catch(function (e: Event) {
      console.log(
        "Failed to initialize PiskelDatabase, local browser saves will be unavailable."
      );
    });
  }

  save(piskel: Piskel): Promise<Event> {
    const name = piskel.getDescriptor().name;
    const description = piskel.getDescriptor().description;
    const date = Date.now();
    const serialized = Serializer.serialize(piskel);

    return this.save_(name, description, date, serialized);
  }

  save_(
    name: string,
    description: string,
    date: number,
    serialized: string
  ): Promise<Event> {
    return this.piskelDatabase.get(name).then((piskelData) => {
      if (typeof piskelData !== "undefined") {
        return this.piskelDatabase.update(name, description, date, serialized);
      } else {
        return this.piskelDatabase.create(name, description, date, serialized);
      }
    });
  }

  load(name: string): Promise<void> {
    return this.piskelDatabase.get(name).then(function (piskelData) {
      if (typeof piskelData !== "undefined") {
        const serialized = piskelData.serialized;
        Deserializer.deserialize(
          JSON.parse(String(serialized)),
          function (piskel: Piskel) {
            assertDefined(app.piskelController, "piskelController").setPiskel(
              piskel
            );
          }
        );
      } else {
        console.log("no local browser save found for name: " + name);
      }
    });
  }

  remove(name: string): Promise<Event> {
    return this.piskelDatabase.delete(name);
  }

  getKeys(): Promise<SavedPiskelInfo[]> {
    return this.piskelDatabase.list();
  }
}
