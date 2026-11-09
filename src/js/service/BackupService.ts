import { app } from "../app";
import type { PublicPiskelController } from "../controller/piskel/PublicPiskelController";
import {
  BackupDatabase,
  type Session,
  type Snapshot
} from "../database/BackupDatabase";
import type { Piskel } from "../model/Piskel";
import { assertDefined } from "../utils/core";
import { Deserializer } from "../utils/serialization/Deserializer";
import { Serializer } from "../utils/serialization/Serializer";

const ONE_SECOND = 1000;

const ONE_MINUTE = 60 * ONE_SECOND;

// Save every minute = 1000 * 60
const BACKUP_INTERVAL = ONE_MINUTE;

// Store a new snapshot every 5 minutes.
const SNAPSHOT_INTERVAL = ONE_MINUTE * 5;

// Store up to 12 snapshots for a piskel session, min. 1 hour of work
const MAX_SNAPSHOTS_PER_SESSION = 12;

const MAX_SESSIONS = 10;

export class BackupService {
  piskelController: PublicPiskelController;
  lastHash: string;
  nextSnapshotDate: number;
  backupDatabase: BackupDatabase;

  constructor(
    piskelController: PublicPiskelController,
    backupDatabase?: BackupDatabase
  ) {
    this.piskelController = piskelController;
    // Immediately store the current when initializing the Service to avoid storing
    // empty sessions.
    this.lastHash = this.piskelController.getPiskel().getHash();
    this.nextSnapshotDate = -1;

    // backupDatabase can be provided for testing purposes.
    this.backupDatabase = backupDatabase || new BackupDatabase();
  }

  init(): void {
    this.backupDatabase.init().then(() => {
      window.setInterval(this.backup.bind(this), BACKUP_INTERVAL);
    });
  }

  // This is purely exposed for testing, so that backup dates can be set programmatically.
  currentDate_(): number {
    return Date.now();
  }

  backup(): Promise<unknown> {
    const piskel = this.piskelController.getPiskel();
    const hash = piskel.getHash();

    // Do not save an unchanged piskel
    if (hash === this.lastHash) {
      return Promise.resolve();
    }

    // Update the hash
    // TODO: should only be done after a successful save.
    this.lastHash = hash;

    // Prepare the backup snapshot.
    const descriptor = piskel.getDescriptor();
    const date = this.currentDate_();
    const snapshot: Snapshot = {
      session_id: assertDefined(app.sessionId, "sessionId"),
      date: date,
      name: descriptor.name,
      description: descriptor.description,
      frames: piskel.getFrameCount(),
      width: piskel.getWidth(),
      height: piskel.getHeight(),
      fps: piskel.getFPS(),
      serialized: Serializer.serialize(piskel)
    };

    return this.getSnapshotsBySessionId(
      assertDefined(app.sessionId, "sessionId")
    )
      .then((snapshots: Snapshot[]): Promise<unknown> => {
        const latest = snapshots[0];

        if (latest && date < this.nextSnapshotDate) {
          // update the latest snapshot
          snapshot.id = latest.id;
          return this.backupDatabase.updateSnapshot(snapshot);
        } else {
          // add a new snapshot
          this.nextSnapshotDate = date + SNAPSHOT_INTERVAL;
          return this.backupDatabase
            .createSnapshot(snapshot)
            .then(() => {
              if (snapshots.length >= MAX_SNAPSHOTS_PER_SESSION) {
                // remove oldest snapshot
                return this.backupDatabase.deleteSnapshot(
                  snapshots[snapshots.length - 1]
                );
              }
            })
            .then(() => {
              const isNewSession = !latest;
              if (!isNewSession) {
                return;
              }
              return this.backupDatabase.getSessions().then((sessions) => {
                if (sessions.length <= MAX_SESSIONS) {
                  // If MAX_SESSIONS has not been reached, no need to delete
                  // previous sessions.
                  return;
                }

                // Prepare an array containing all the ids of the sessions to be deleted.
                const sessionIdsToDelete = sessions
                  .sort(function (s1, s2) {
                    return s1.startDate - s2.startDate;
                  })
                  .map(function (s) {
                    return s.id;
                  })
                  .slice(0, sessions.length - MAX_SESSIONS);

                // Delete all the extra sessions.
                return Promise.all(
                  sessionIdsToDelete.map((id: string) => {
                    return this.deleteSession(id);
                  })
                );
              });
            });
        }
      })
      .catch(function (e: Event) {
        console.error(e);
      });
  }

  getSnapshotsBySessionId(sessionId: string): Promise<Snapshot[]> {
    return this.backupDatabase.getSnapshotsBySessionId(sessionId);
  }

  deleteSession(sessionId: string): Promise<void> {
    return this.backupDatabase.deleteSnapshotsForSession(sessionId);
  }

  getPreviousPiskelInfo(): Promise<Snapshot | null> {
    return this.backupDatabase.findLastSnapshot(function (snapshot: {
      session_id: string | undefined;
    }) {
      return snapshot.session_id !== app.sessionId;
    });
  }

  list(): Promise<Session[]> {
    return this.backupDatabase.getSessions();
  }

  loadSnapshotById(snapshotId: number): Promise<void> {
    return new Promise<void>((resolve) => {
      this.backupDatabase.getSnapshot(snapshotId).then(function (snapshot) {
        Deserializer.deserialize(
          JSON.parse(assertDefined(snapshot, "snapshot").serialized),
          function (piskel: Piskel) {
            assertDefined(app.piskelController, "piskelController").setPiskel(
              piskel
            );
            resolve();
          }
        );
      });
    });
  }

  // Load "latest" backup snapshot.
  load(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.getPreviousPiskelInfo().then(function (snapshot) {
        Deserializer.deserialize(
          JSON.parse(assertDefined(snapshot, "snapshot").serialized),
          function (piskel: Piskel) {
            assertDefined(app.piskelController, "piskelController").setPiskel(
              piskel
            );
            resolve();
          }
        );
      });
    });
  }
}
