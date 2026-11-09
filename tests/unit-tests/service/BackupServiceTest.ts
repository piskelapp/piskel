import { app } from "../../../src/js/app";
import type { PublicPiskelController } from "../../../src/js/controller/piskel/PublicPiskelController";
import type {
  BackupDatabase,
  Session,
  Snapshot
} from "../../../src/js/database/BackupDatabase";
import { BackupService } from "../../../src/js/service/BackupService";
import { assertDefined } from "../../../src/js/utils/core";
import { Serializer } from "../../../src/js/utils/serialization/Serializer";
import { mock } from "../testutils/TestUtils";
import { beforeEach, describe, expect, it, vi } from "vitest";

type MockPiskel = {
  _descriptor: { name: string; description: string };
  _hash: string | null;
  getDescriptor(): { name: string; description: string };
  getHash(): string | null;
  getWidth(): number;
  getHeight(): number;
  getFrameCount(): number;
  getFPS(): number;
};

type MockBackupDatabase = {
  _sessions: Record<string, Snapshot[]>;
  init(): void;
  getSnapshotsBySessionId(sessionId: string): Promise<Snapshot[]>;
  updateSnapshot(snapshot?: Snapshot): Promise<unknown>;
  createSnapshot(snapshot?: Snapshot): Promise<unknown>;
  deleteSnapshot(snapshot?: Snapshot): Promise<unknown>;
  getSessions(): Promise<Partial<Session>[]>;
  deleteSnapshotsForSession(sessionId?: string): Promise<unknown>;
  findLastSnapshot(): Promise<Snapshot | null>;
};

describe("BackupService test", function () {
  // Some helper const.
  const ONE_SECOND = 1000;
  const ONE_MINUTE = 60 * ONE_SECOND;

  let mockBackupDatabase: MockBackupDatabase;
  let mockPiskel: MockPiskel;
  let mockPiskelController;

  // Globals used in stubs
  const stubValues = {
    snapshotDate: null,
    serializedPiskel: mock<string | null>(null)
  };

  let snapshotDate: number;

  // Main test object.
  let backupService: BackupService;

  beforeEach(function () {
    // Create mocks.
    mockBackupDatabase = {
      // Test property
      _sessions: {},
      init: function () {},
      getSnapshotsBySessionId: function (sessionId: string | number) {
        // Default implementation that looks up in _sessions or returns an
        // empty array.
        return Promise.resolve(this._sessions[sessionId] || []);
      },
      updateSnapshot: function () {
        return Promise.resolve();
      },
      createSnapshot: function () {
        return Promise.resolve();
      },
      deleteSnapshot: function () {
        return Promise.resolve();
      },
      getSessions: function () {
        return Promise.resolve([]);
      },
      deleteSnapshotsForSession: function () {
        return Promise.resolve();
      },
      findLastSnapshot: function () {
        return Promise.resolve(null);
      }
    };

    mockPiskel = {
      _descriptor: { name: "", description: "" },
      _hash: null,
      getDescriptor: function () {
        return this._descriptor;
      },
      getHash: function () {
        return this._hash;
      },
      getWidth: function () {
        return 32;
      },
      getHeight: function () {
        return 32;
      },
      getFrameCount: function () {
        return 1;
      },
      getFPS: function () {
        return 12;
      }
    };

    mockPiskelController = {
      getPiskel: function () {
        return mockPiskel;
      },
      setPiskel: function () {}
    };

    vi.spyOn(Serializer, "serialize").mockImplementation(function () {
      return String(stubValues.serializedPiskel);
    });

    // Create test backup service with mocks.
    backupService = new BackupService(
      mock<PublicPiskelController>(mockPiskelController),
      mock<BackupDatabase>(mockBackupDatabase)
    );
    // Override the currentDate_ internal helper in order to set
    // custom snapshot dates.
    backupService.currentDate_ = function () {
      return snapshotDate;
    };
  });

  const createSnapshotObject = function (
    session_id: number,
    name: string,
    description: string,
    date: number,
    serialized: string
  ) {
    return mock<Snapshot>({
      session_id: session_id,
      name: name,
      description: description,
      date: date,
      serialized: serialized
    });
  };

  const preparePiskelMocks = function (
    session_id: string | number | undefined,
    name: string,
    description: string,
    hash: string,
    serialized: string | null
  ) {
    // Update the session id.
    app.sessionId = mock<string>(session_id);

    // Update the piskel mock.
    mockPiskel._descriptor.name = name;
    mockPiskel._descriptor.description = description;
    mockPiskel._hash = hash;
    stubValues.serializedPiskel = serialized;
  };

  it("calls create to backup", () =>
    new Promise<void>((done) => {
      preparePiskelMocks(
        1,
        "piskel_name",
        "piskel_desc",
        "piskel_hash",
        "serialized"
      );

      // Set snashot date.
      snapshotDate = 5;

      // No snapshots currently saved.
      vi.spyOn(mockBackupDatabase, "createSnapshot");

      backupService.backup().then(function () {
        expect(mockBackupDatabase.createSnapshot).toHaveBeenCalled();
        const snapshot = assertDefined(
          assertDefined(
            vi.mocked(mockBackupDatabase.createSnapshot).mock.lastCall,
            "lastCall"
          )[0],
          "snapshot"
        );
        expect(snapshot.session_id).toEqual(1);
        expect(snapshot.name).toEqual("piskel_name");
        expect(snapshot.description).toEqual("piskel_desc");
        expect(snapshot.date).toEqual(5);
        expect(snapshot.serialized).toEqual("serialized");
        done();
      });
    }));

  it("does not call update to backup if the hash did not change", () =>
    new Promise<void>((done) => {
      const session = 1;
      const date1 = 0;
      const date2 = ONE_MINUTE;

      const snapshot1 = createSnapshotObject(
        1,
        "piskel_name1",
        "piskel_desc1",
        date1,
        "serialized1"
      );
      preparePiskelMocks(
        session,
        "piskel_name1",
        "piskel_desc1",
        "hash",
        "serialized1"
      );
      snapshotDate = date1;

      // Prepare spies.
      vi.spyOn(mockBackupDatabase, "updateSnapshot");
      vi.spyOn(mockBackupDatabase, "createSnapshot");

      backupService.backup().then(function () {
        // The snapshot should have been created using "createSnapshot".
        expect(mockBackupDatabase.createSnapshot).toHaveBeenCalled();
        expect(
          vi.mocked(mockBackupDatabase.updateSnapshot).mock.calls.length > 0
        ).toBe(false);

        // Prepare snapshot1 to be returned in the list of already existing sessions.
        mockBackupDatabase._sessions[session] = [snapshot1];

        preparePiskelMocks(
          session,
          "piskel_name2",
          "piskel_desc2",
          "hash",
          "serialized2"
        );
        snapshotDate = date2;

        backupService.backup().then(function () {
          // Check that createSnapshot was not called again and updateSnapshot either.
          expect(
            vi.mocked(mockBackupDatabase.createSnapshot).mock.calls.length
          ).toEqual(1);
          expect(
            vi.mocked(mockBackupDatabase.updateSnapshot).mock.calls.length
          ).toEqual(0);
          done();
        });
      });
    }));

  it("calls update to backup if there is an existing & recent snapshot", () =>
    new Promise<void>((done) => {
      const session = 1;
      const date1 = 0;
      const date2 = ONE_MINUTE;

      const snapshot1 = createSnapshotObject(
        1,
        "piskel_name1",
        "piskel_desc1",
        date1,
        "serialized1"
      );
      preparePiskelMocks(
        session,
        "piskel_name1",
        "piskel_desc1",
        "piskel_hash1",
        "serialized1"
      );
      snapshotDate = date1;

      // Prepare spies.
      vi.spyOn(mockBackupDatabase, "updateSnapshot");
      vi.spyOn(mockBackupDatabase, "createSnapshot");

      backupService.backup().then(function () {
        // The snapshot should have been created using "createSnapshot".
        expect(mockBackupDatabase.createSnapshot).toHaveBeenCalled();

        // Prepare snapshot1 to be returned in the list of already existing sessions.
        mockBackupDatabase._sessions[session] = [snapshot1];

        preparePiskelMocks(
          session,
          "piskel_name2",
          "piskel_desc2",
          "piskel_hash2",
          "serialized2"
        );
        snapshotDate = date2;

        backupService.backup().then(function () {
          // Check that createSnapshot was not called again.
          expect(
            vi.mocked(mockBackupDatabase.createSnapshot).mock.calls.length
          ).toEqual(1);
          // Check that updateSnapshot was called with the expected arguments.
          expect(mockBackupDatabase.updateSnapshot).toHaveBeenCalled();
          const snapshot = assertDefined(
            assertDefined(
              vi.mocked(mockBackupDatabase.updateSnapshot).mock.lastCall,
              "lastCall"
            )[0],
            "snapshot"
          );
          expect(snapshot.session_id).toEqual(session);
          expect(snapshot.name).toEqual("piskel_name2");
          expect(snapshot.description).toEqual("piskel_desc2");
          expect(snapshot.date).toEqual(date2);
          expect(snapshot.serialized).toEqual("serialized2");
          done();
        });
      });
    }));

  it("creates a new snapshot if the time difference is big enough", () =>
    new Promise<void>((done) => {
      const session = 1;
      const date1 = 0;
      const date2 = 6 * ONE_MINUTE;

      const snapshot1 = createSnapshotObject(
        1,
        "piskel_name1",
        "piskel_desc1",
        date1,
        "serialized1"
      );
      preparePiskelMocks(
        session,
        "piskel_name1",
        "piskel_desc1",
        "piskel_hash1",
        "serialized1"
      );
      snapshotDate = date1;

      // Prepare spies.
      vi.spyOn(mockBackupDatabase, "updateSnapshot");
      vi.spyOn(mockBackupDatabase, "createSnapshot");

      backupService.backup().then(function () {
        // The snapshot should have been created using "createSnapshot".
        expect(mockBackupDatabase.createSnapshot).toHaveBeenCalled();

        // Prepare snapshot1 to be returned in the list of already existing sessions.
        mockBackupDatabase._sessions[session] = [snapshot1];

        preparePiskelMocks(
          session,
          "piskel_name2",
          "piskel_desc2",
          "piskel_hash2",
          "serialized2"
        );
        snapshotDate = date2;

        backupService.backup().then(function () {
          // Check that updateSnapshot was not called.
          expect(
            vi.mocked(mockBackupDatabase.updateSnapshot).mock.calls.length
          ).toEqual(0);
          // Check that updateSnapshot was called with the expected arguments.
          expect(mockBackupDatabase.createSnapshot).toHaveBeenCalled();
          const snapshot = assertDefined(
            assertDefined(
              vi.mocked(mockBackupDatabase.createSnapshot).mock.lastCall,
              "lastCall"
            )[0],
            "snapshot"
          );
          expect(snapshot.session_id).toEqual(session);
          expect(snapshot.name).toEqual("piskel_name2");
          expect(snapshot.description).toEqual("piskel_desc2");
          expect(snapshot.date).toEqual(date2);
          expect(snapshot.serialized).toEqual("serialized2");
          done();
        });
      });
    }));

  it("deletes old snapshots if there are too many of them", () =>
    new Promise<void>((done) => {
      const session = 1;
      const maxPerSession = 12;

      preparePiskelMocks(
        session,
        "piskel_name",
        "piskel_desc",
        "piskel_hash",
        "serialized12"
      );
      snapshotDate = 12 * 6 * ONE_MINUTE;

      // Prepare spies.
      vi.spyOn(mockBackupDatabase, "deleteSnapshot");
      vi.spyOn(mockBackupDatabase, "createSnapshot");

      // Prepare array of already saved snapshots.
      mockBackupDatabase._sessions[session] = [];
      for (let i = maxPerSession - 1; i >= 0; i--) {
        mockBackupDatabase._sessions[session].push(
          createSnapshotObject(
            session,
            "piskel_name",
            "piskel_desc",
            i * 6 * ONE_MINUTE,
            "serialized" + i
          )
        );
      }

      backupService.backup().then(function () {
        expect(mockBackupDatabase.createSnapshot).toHaveBeenCalled();
        expect(mockBackupDatabase.deleteSnapshot).toHaveBeenCalled();
        // It will simply attempt to delete the last item from the array of saved sessions
        const snapshot = assertDefined(
          assertDefined(
            vi.mocked(mockBackupDatabase.deleteSnapshot).mock.lastCall,
            "lastCall"
          )[0],
          "snapshot"
        );
        expect(snapshot.session_id).toEqual(session);
        expect(snapshot.name).toEqual("piskel_name");
        expect(snapshot.description).toEqual("piskel_desc");
        expect(snapshot.date).toEqual(0);
        expect(snapshot.serialized).toEqual("serialized0");
        done();
      });
    }));

  it("deletes a session if there are too many of them", () =>
    new Promise<void>((done) => {
      const session = "session10";
      const maxSessions = 10;

      preparePiskelMocks(
        session,
        "piskel_name",
        "piskel_desc",
        "piskel_hash",
        "serialized12"
      );
      snapshotDate = 10 * ONE_MINUTE;

      // Prepare array of sessions.
      const sessions = [];
      for (let i = 0; i < maxSessions + 1; i++) {
        sessions.push({
          id: "session" + i,
          startDate: i * ONE_MINUTE
        });
      }

      // Prepare spies.
      vi.spyOn(mockBackupDatabase, "getSessions").mockReturnValue(
        Promise.resolve(sessions)
      );
      vi.spyOn(mockBackupDatabase, "createSnapshot");
      vi.spyOn(mockBackupDatabase, "deleteSnapshotsForSession");

      backupService.backup().then(function () {
        expect(mockBackupDatabase.createSnapshot).toHaveBeenCalled();
        expect(mockBackupDatabase.deleteSnapshotsForSession).toHaveBeenCalled();
        // It will simply attempt to delete the last item from the array of saved sessions
        const sessionId = assertDefined(
          vi.mocked(mockBackupDatabase.deleteSnapshotsForSession).mock.lastCall,
          "lastCall"
        )[0];
        expect(sessionId).toEqual("session0");
        done();
      });
    }));
});
