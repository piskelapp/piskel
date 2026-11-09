import { app } from "../../app";
import type { LocalStorageKey } from "../../service/storage/LocalStorageService";
import { assertDefined } from "../../utils/core";
import type { PiskelDatabase, SavedPiskel } from "../PiskelDatabase";

// Simple migration helper to move local storage saves to indexed db.
export const MigrateLocalStorageToIndexedDb = {
  migrate(piskelDatabase: PiskelDatabase): Promise<void> {
    const localStorageService = assertDefined(
      app.localStorageService,
      "localStorageService"
    );

    const localStorageKeys = localStorageService.getKeys();
    const migrationData: SavedPiskel[] = localStorageKeys.map(function (
      key: LocalStorageKey
    ) {
      return {
        name: key.name,
        description: key.description,
        date: key.date,
        serialized: localStorageService.getPiskel(key.name)
      };
    });

    return new Promise<void>(function (resolve) {
      // Define the sequential migration process.
      // Wait for each sprite to be saved before saving the next one.
      const success = true;
      const migrateSprite = function (index: number) {
        const data = migrationData[index];
        if (!data) {
          console.log(
            "Data migration from local storage to indexed db finished."
          );
          if (success) {
            console.log(
              "Local storage piskels successfully migrated. Old copies will be deleted."
            );
            MigrateLocalStorageToIndexedDb.deleteLocalStoragePiskels();
          }

          resolve();
        } else {
          MigrateLocalStorageToIndexedDb.save_(piskelDatabase, data)
            .then(function () {
              migrateSprite(index + 1);
            })
            .catch(function () {
              console.error(
                "Failed to migrate local storage sprite for name: " + data.name
              );
              migrateSprite(index + 1);
            });
        }
      };

      // Start the migration.
      migrateSprite(0);
    });
  },

  save_(
    piskelDatabase: PiskelDatabase,
    piskelData: SavedPiskel
  ): Promise<Event> {
    return piskelDatabase.get(piskelData.name).then(function (data) {
      if (typeof data !== "undefined") {
        return piskelDatabase.update(
          piskelData.name,
          piskelData.description,
          piskelData.date,
          piskelData.serialized
        );
      } else {
        return piskelDatabase.create(
          piskelData.name,
          piskelData.description,
          piskelData.date,
          piskelData.serialized
        );
      }
    });
  },

  deleteLocalStoragePiskels(): void {
    const localStorageKeys = assertDefined(
      app.localStorageService,
      "localStorageService"
    ).getKeys();

    // Remove all sprites.
    localStorageKeys.forEach(function (key: LocalStorageKey) {
      window.localStorage.removeItem("piskel." + key.name);
    });

    // Remove keys.
    window.localStorage.removeItem("piskel.keys");
  }
};
