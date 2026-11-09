import { app } from "../../app";
import type { PublicPiskelController } from "../../controller/piskel/PublicPiskelController";
import type { Piskel } from "../../model/Piskel";
import { assertDefined } from "../../utils/core";
import { Deserializer } from "../../utils/serialization/Deserializer";
import { Serializer } from "../../utils/serialization/Serializer";

export type LocalStorageKey = {
  name: string;
  description: string;
  date: number;
};

export class LocalStorageService {
  piskelController: PublicPiskelController;

  constructor(piskelController: PublicPiskelController) {
    if (piskelController === undefined) {
      throw "Bad LocalStorageService initialization: <undefined piskelController>";
    }
    this.piskelController = piskelController;
  }

  init(): void {}

  save(piskel: Piskel): Promise<void> {
    const name = piskel.getDescriptor().name;
    const description = piskel.getDescriptor().description;

    const serialized = Serializer.serialize(piskel);
    if (
      assertDefined(app.localStorageService, "localStorageService").getPiskel(
        name
      )
    ) {
      const confirmOverwrite = window.confirm(
        "There is already a piskel saved as " + name + ". Overwrite ?"
      );
      if (!confirmOverwrite) {
        return Promise.reject(
          'Cancelled by user, "' + name + '" already exists'
        );
      }
    }

    try {
      this.removeFromKeys_(name);
      this.addToKeys_(name, description, Date.now());
      window.localStorage.setItem("piskel." + name, serialized);
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e instanceof Error ? e.message : String(e));
    }
  }

  load(name: string): void {
    const piskelString = this.getPiskel(name);

    Deserializer.deserialize(
      JSON.parse(String(piskelString)),
      function (piskel: Piskel) {
        assertDefined(app.piskelController, "piskelController").setPiskel(
          piskel
        );
      }
    );
  }

  remove(name: string): void {
    this.removeFromKeys_(name);
    window.localStorage.removeItem("piskel." + name);
  }

  saveKeys_(keys: LocalStorageKey[]): void {
    window.localStorage.setItem("piskel.keys", JSON.stringify(keys));
  }

  removeFromKeys_(name: string): void {
    const keys = this.getKeys();
    const otherKeys = keys.filter(function (key: LocalStorageKey) {
      return key.name !== name;
    });

    this.saveKeys_(otherKeys);
  }

  getKey_(name: string): LocalStorageKey | null {
    const matches = this.getKeys().filter(function (key: LocalStorageKey) {
      return key.name === name;
    });
    if (matches.length > 0) {
      return matches[0];
    } else {
      return null;
    }
  }

  addToKeys_(name: string, description: string, date: number): void {
    const keys = this.getKeys();
    keys.push({
      name: name,
      description: description,
      date: date
    });
    this.saveKeys_(keys);
  }

  getPiskel(name: string): string | null {
    return window.localStorage.getItem("piskel." + name);
  }

  getKeys(name?: string): LocalStorageKey[] {
    const keysString = window.localStorage.getItem("piskel.keys");
    return JSON.parse(String(keysString)) || [];
  }
}
