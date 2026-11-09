import { assertDefined } from "../utils/core";

const DB_NAME = "PiskelSessionsDatabase";

const DB_VERSION = 1;

// Simple wrapper to promisify a request.
const _requestPromise = function (req: IDBRequest): Promise<Event> {
  return new Promise<Event>(function (resolve, reject) {
    req.onsuccess = resolve;
    req.onerror = reject;
  });
};

/**
 * The BackupDatabase handles all the database interactions related
 * to piskel snapshots continuously saved while during the usage of
 * Piskel.
 */
export type Snapshot = {
  id?: number;
  session_id: string;
  date: number;
  name: string;
  description: string;
  frames: number;
  width: number;
  height: number;
  fps: number;
  serialized: string;
};

export type Session = {
  startDate: number;
  endDate: number;
  name: string;
  description: string;
  id: string;
  count: number;
};

export class BackupDatabase {
  db: IDBDatabase | null;

  constructor() {
    this.db = null;
  }

  static DB_NAME: string = DB_NAME;

  /**
   * Open and initialize the database.
   * Returns a promise that resolves when the database is opened.
   */
  init(): Promise<IDBDatabase | null | void> {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = this.onUpgradeNeeded_.bind(this);

    return _requestPromise(request)
      .then((event: Event) => {
        this.db = (event.target as IDBRequest<IDBDatabase>).result;
        return this.db;
      })
      .catch(function (e: Event) {
        console.log("Could not initialize the piskel backup database");
      });
  }

  onUpgradeNeeded_(event: Event): void {
    // Set this.db early to allow migration scripts to access it in oncomplete.
    const db = (event.target as IDBRequest<IDBDatabase>).result;
    this.db = db;

    // Create an object store "piskels" with the autoIncrement flag set as true.
    const objectStore = db.createObjectStore("snapshots", {
      keyPath: "id",
      autoIncrement: true
    });

    objectStore.createIndex("session_id", "session_id", { unique: false });
    objectStore.createIndex("date", "date", { unique: false });
    objectStore.createIndex("session_id, date", ["session_id", "date"], {
      unique: false
    });

    objectStore.transaction.oncomplete = (event: Event) => {
      // Nothing to do at the moment!
    };
  }

  openObjectStore_(): IDBObjectStore {
    return assertDefined(this.db, "db")
      .transaction(["snapshots"], "readwrite")
      .objectStore("snapshots");
  }

  /**
   * Send an add request for the provided snapshot.
   * Returns a promise that resolves the request event.
   */
  createSnapshot(snapshot: Snapshot): Promise<Event> {
    const objectStore = this.openObjectStore_();
    const request = objectStore.add(snapshot);
    return _requestPromise(request);
  }

  /**
   * Send a put request for the provided snapshot.
   * Returns a promise that resolves the request event.
   */
  updateSnapshot(snapshot: Snapshot): Promise<Event> {
    const objectStore = this.openObjectStore_();
    const request = objectStore.put(snapshot);
    return _requestPromise(request);
  }

  /**
   * Send a delete request for the provided snapshot.
   * Returns a promise that resolves the request event.
   */
  deleteSnapshot(snapshot: Snapshot): Promise<Event> {
    const objectStore = this.openObjectStore_();
    const request = objectStore.delete(assertDefined(snapshot.id, "id"));
    return _requestPromise(request);
  }

  /**
   * Send a get request for the provided snapshotId.
   * Returns a promise that resolves the request event.
   */
  getSnapshot(snapshotId: number): Promise<Snapshot | undefined> {
    const objectStore = this.openObjectStore_();
    const request = objectStore.get(snapshotId);
    return _requestPromise(request).then(function (event: Event) {
      return (event.target as IDBRequest<Snapshot | undefined>).result;
    });
  }

  /**
   * Get the last (most recent) snapshot that satisfies the accept filter provided.
   * Returns a promise that will resolve with the first matching snapshot (or null
   * if no valid snapshot is found).
   *
   * @param {Function} accept:
   *        Filter method that takes a snapshot as argument and should return true
   *        if the snapshot is valid.
   */
  findLastSnapshot(
    accept: (snapshot: Snapshot) => boolean
  ): Promise<Snapshot | null> {
    // Open a transaction to the snapshots object store.
    const objectStore = assertDefined(this.db, "db")
      .transaction(["snapshots"])
      .objectStore("snapshots");

    const index = objectStore.index("date");
    const range = IDBKeyRange.upperBound(Infinity);

    return new Promise<Snapshot | null>(function (resolve) {
      index.openCursor(range, "prev").onsuccess = function (event: Event) {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>)
          .result;
        const snapshot: Snapshot | null = cursor && cursor.value;

        // Resolve null if we couldn't find a matching snapshot.
        if (!snapshot) {
          resolve(null);
        } else if (accept(snapshot)) {
          resolve(snapshot);
        } else {
          assertDefined(cursor, "cursor").continue();
        }
      };
    });
  }

  /**
   * Retrieve all the snapshots for a given session id, sorted by descending date order.
   * Returns a promise that resolves with an array of snapshots.
   *
   * @param {String} sessionId
   *        The session id
   */
  getSnapshotsBySessionId(sessionId: string): Promise<Snapshot[]> {
    // Open a transaction to the snapshots object store.
    const objectStore = assertDefined(this.db, "db")
      .transaction(["snapshots"])
      .objectStore("snapshots");

    // Loop on all the saved snapshots for the provided piskel id
    const index = objectStore.index("session_id, date");
    const keyRange = IDBKeyRange.bound([sessionId, 0], [sessionId, Infinity]);

    const snapshots: Snapshot[] = [];
    return new Promise<Snapshot[]>(function (resolve) {
      // Ordered by date in descending order.
      index.openCursor(keyRange, "prev").onsuccess = function (event: Event) {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>)
          .result;
        if (cursor) {
          snapshots.push(cursor.value);
          cursor.continue();
        } else {
          // Consumed all piskel snapshots
          resolve(snapshots);
        }
      };
    });
  }

  getSessions(): Promise<Session[]> {
    // Open a transaction to the snapshots object store.
    const objectStore = assertDefined(this.db, "db")
      .transaction(["snapshots"])
      .objectStore("snapshots");

    const sessions: Record<string, Session> = {};

    const _createSession = function (snapshot: Snapshot) {
      sessions[snapshot.session_id] = {
        startDate: snapshot.date,
        endDate: snapshot.date,
        name: snapshot.name,
        description: snapshot.description,
        id: snapshot.session_id,
        count: 1
      };
    };

    const _updateSession = function (snapshot: Snapshot) {
      const s = sessions[snapshot.session_id];
      s.startDate = Math.min(s.startDate, snapshot.date);
      s.endDate = Math.max(s.endDate, snapshot.date);
      s.count++;

      if (s.endDate === snapshot.date) {
        // If the endDate was updated, update also the session metadata to
        // reflect the latest state.
        s.name = snapshot.name;
        s.description = snapshot.description;
      }
    };

    const index = objectStore.index("date");
    const range = IDBKeyRange.upperBound(Infinity);

    return new Promise<Record<string, Session>>(function (resolve) {
      index.openCursor(range, "prev").onsuccess = function (event: Event) {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>)
          .result;
        const snapshot: Snapshot | null = cursor && cursor.value;
        if (!snapshot) {
          resolve(sessions);
        } else {
          if (sessions[snapshot.session_id]) {
            _updateSession(snapshot);
          } else {
            _createSession(snapshot);
          }
          assertDefined(cursor, "cursor").continue();
        }
      };
    }).then(function (sessions) {
      // Convert the sessions map to an array.
      return Object.keys(sessions).map(function (key: string) {
        return sessions[key];
      });
    });
  }

  deleteSnapshotsForSession(sessionId: string): Promise<void> {
    // Open a transaction to the snapshots object store.
    const objectStore = this.openObjectStore_();

    // Loop on all the saved snapshots for the provided piskel id
    const index = objectStore.index("session_id");
    const keyRange = IDBKeyRange.only(sessionId);

    return new Promise<void>(function (resolve) {
      index.openCursor(keyRange).onsuccess = function (event: Event) {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>)
          .result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
    });
  }
}
