import { assertDefined } from "../utils/core";
import { MigrateLocalStorageToIndexedDb } from "./migrate/MigrateLocalStorageToIndexedDb";

const DB_NAME = "PiskelDatabase";

const DB_VERSION = 1;

// Simple wrapper to promisify a request.
const _requestPromise = function (req: IDBRequest): Promise<Event> {
  return new Promise<Event>(function (resolve, reject) {
    req.onsuccess = resolve;
    req.onerror = reject;
  });
};

/**
 * The PiskelDatabase handles all the database interactions related
 * to the local piskel saved that can be performed in-browser.
 */
export type SavedPiskel = {
  name: string;
  description: string;
  date: number;
  serialized: string | null;
};

export type SavedPiskelInfo = Omit<SavedPiskel, "serialized">;

export class PiskelDatabase {
  db: IDBDatabase | null;

  constructor(options?: unknown) {
    this.db = null;
  }

  static DB_NAME: string = DB_NAME;

  init(): Promise<IDBDatabase | null> {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = this.onUpgradeNeeded_.bind(this);

    return _requestPromise(request).then((event: Event) => {
      this.db = (event.target as IDBRequest<IDBDatabase>).result;
      return this.db;
    });
  }

  onUpgradeNeeded_(event: Event): void {
    // Set this.db early to allow migration scripts to access it in oncomplete.
    const db = (event.target as IDBRequest<IDBDatabase>).result;
    this.db = db;

    // Create an object store "piskels" with the autoIncrement flag set as true.
    const objectStore = db.createObjectStore("piskels", { keyPath: "name" });
    objectStore.transaction.oncomplete = (event: Event) => {
      MigrateLocalStorageToIndexedDb.migrate(this);
    };
  }

  openObjectStore_(): IDBObjectStore {
    return assertDefined(this.db, "db")
      .transaction(["piskels"], "readwrite")
      .objectStore("piskels");
  }

  /**
   * Send a get request for the provided name.
   * Returns a promise that resolves the request event.
   */
  get(name: string): Promise<SavedPiskel | undefined> {
    const objectStore = this.openObjectStore_();
    return _requestPromise(objectStore.get(name)).then(function (event: Event) {
      return (event.target as IDBRequest<SavedPiskel | undefined>).result;
    });
  }

  /**
   * List all locally saved piskels.
   * Returns a promise that resolves an array of objects:
   * - name: name of the piskel
   * - description: description of the piskel
   * - date: save date
   *
   * The sprite content is not contained in the object and
   * needs to be retrieved with a separate get.
   */
  list(): Promise<SavedPiskelInfo[]> {
    const piskels: SavedPiskelInfo[] = [];
    const objectStore = this.openObjectStore_();
    const cursor = objectStore.openCursor();

    return new Promise<SavedPiskelInfo[]>(function (resolve, reject) {
      cursor.onsuccess = function (event: Event) {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>)
          .result;
        if (cursor) {
          piskels.push({
            name: cursor.value.name,
            date: cursor.value.date,
            description: cursor.value.description
          });
          cursor.continue();
        } else {
          // Cursor consumed all availabled piskels
          resolve(piskels);
        }
      };

      cursor.onerror = function () {
        reject();
      };
    });
  }

  /**
   * Send an put request for the provided args.
   * Returns a promise that resolves the request event.
   */
  update(
    name: string,
    description: string,
    date: number,
    serialized: string | null
  ): Promise<Event> {
    const data: SavedPiskel = {
      name: name,
      serialized: serialized,
      date: date,
      description: description
    };

    const objectStore = this.openObjectStore_();
    return _requestPromise(objectStore.put(data));
  }

  /**
   * Send an add request for the provided args.
   * Returns a promise that resolves the request event.
   */
  create(
    name: string,
    description: string,
    date: number,
    serialized: string | null
  ): Promise<Event> {
    const data: SavedPiskel = {
      name: name,
      serialized: serialized,
      date: date,
      description: description
    };

    const objectStore = this.openObjectStore_();
    return _requestPromise(objectStore.add(data));
  }

  /**
   * Delete a saved piskel for the provided name.
   * Returns a promise that resolves the request event.
   */
  delete(name: string): Promise<Event> {
    const objectStore = this.openObjectStore_();
    return _requestPromise(objectStore.delete(name));
  }
}
