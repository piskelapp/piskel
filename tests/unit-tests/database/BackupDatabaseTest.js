describe('BackupDatabase test', function () {

  // Test object.
  var backupDatabase;

  var _toSnapshot = function (session_id, name, description, date, serialized) {
    return {
      session_id: session_id,
      name: name,
      description: description,
      date: date,
      serialized: serialized
    };
  };

  var _checkSnapshot = function (actual, expected) {
    expect(actual.session_id).toBe(expected.session_id);
    expect(actual.name).toBe(expected.name);
    expect(actual.description).toBe(expected.description);
    expect(actual.date).toBe(expected.date);
    expect(actual.serialized).toBe(expected.serialized);
  };

  var _addSnapshots = function (snapshots) {
    var _add = function (index) {
      return backupDatabase.createSnapshot(snapshots[index]).then(function () {
        if (snapshots[index + 1]) {
          return _add(index + 1);
        } else {
          return Promise.resolve();
        }
      })
    };

    return _add(0);
  };

  beforeEach(function (done) {
    // Drop the database before each test.
    var dbName = pskl.database.BackupDatabase.DB_NAME;
    var req = window.indexedDB.deleteDatabase(dbName);
    req.onsuccess = done;
  });

  afterEach(function () {
    // Close the database if it was still open.
    if (backupDatabase && backupDatabase.db) {
      backupDatabase.db.close();
    }
  });

  it('initializes the DB and returns a promise', function (done) {
    backupDatabase = new pskl.database.BackupDatabase();
    backupDatabase.init().then(done);
  });

  it('can add snapshots and retrieve them', function (done) {
    var snapshot = _toSnapshot('session_1', 'name', 'desc', 0, 'serialized');

    backupDatabase = new pskl.database.BackupDatabase();
    backupDatabase.init()
      .then(function (db) {
        // Create snapshot in backup database
        return backupDatabase.createSnapshot(snapshot);
      }).then(function () {
        // Get snapshots for session_1 in backup database
        return backupDatabase.getSnapshotsBySessionId('session_1');
      }).then(function (snapshots) {
        expect(snapshots.length).toBe(1);
        _checkSnapshot(snapshots[0], snapshot);
        done();
      });
  });

  it('can update snapshots and retrieve them', function (done) {
    var snapshot = _toSnapshot('session_1', 'name', 'desc', 0, 'serialized');
    var updated = _toSnapshot('session_1', 'name_updated', 'desc_updated', 10, 'serialized_updated');

    backupDatabase = new pskl.database.BackupDatabase();
    backupDatabase.init()
      .then(function () {
        // Create snapshot in backup database
        return backupDatabase.createSnapshot(snapshot);
      }).then(function () {
        // Retrieve snapshots to get the inserted snapshot id
        return backupDatabase.getSnapshotsBySessionId('session_1');
      }).then(function (snapshots) {
        // Update snapshot in backup database
        updated.id = snapshots[0].id;
        return backupDatabase.updateSnapshot(updated);
      }).then(function () {
        // Get snapshots for session_1 in backup database
        return backupDatabase.getSnapshotsBySessionId('session_1');
      }).then(function (snapshots) {
        expect(snapshots.length).toBe(1);
        _checkSnapshot(snapshots[0], updated);
        done();
      });
  });

  it('can delete snapshots', function (done) {
    var testSnapshots = [
      _toSnapshot('session_1', 'name1', 'desc1', 0, 'serialized1'),
      _toSnapshot('session_1', 'name2', 'desc2', 0, 'serialized2'),
      _toSnapshot('session_2', 'name3', 'desc3', 0, 'serialized3')
    ];

    backupDatabase = new pskl.database.BackupDatabase();
    backupDatabase.init()
      .then(function () {
        return _addSnapshots(testSnapshots);
      }).then(function () {
        // Retrieve snapshots to get the inserted snapshot id
        return backupDatabase.getSnapshotsBySessionId('session_1');
      }).then(function (snapshots) {
        expect(snapshots.length).toBe(2);
        // Delete snapshot with 'name1' from backup database
        var snapshot = snapshots.filter(function (s) { return s.name === 'name1' })[0];
        return backupDatabase.deleteSnapshot(snapshot);
      }).then(function () {
        // Get snapshots for session_1 in backup database
        return backupDatabase.getSnapshotsBySessionId('session_1');
      }).then(function (snapshots) {
        expect(snapshots.length).toBe(1);
        _checkSnapshot(snapshots[0], testSnapshots[1]);
        done();
      });
  });

  it('returns an empty array when calling getSnapshots for an empty session', function (done) {
    var testSnapshots = [
      _toSnapshot('session_1', 'name1', 'desc1', 0, 'serialized1'),
      _toSnapshot('session_1', 'name2', 'desc2', 0, 'serialized2'),
      _toSnapshot('session_2', 'name3', 'desc3', 0, 'serialized3')
    ];

    backupDatabase = new pskl.database.BackupDatabase();
    backupDatabase.init()
      .then(function () {
        return _addSnapshots(testSnapshots);
      }).then(function () {
        // Retrieve snapshots for a session that doesn't exist
        return backupDatabase.getSnapshotsBySessionId('session_3');
      }).then(function (snapshots) {
        expect(snapshots.length).toBe(0);
        done();
      });
  });

  it('can delete all snapshots for a session', function (done) {
    var testSnapshots = [
      _toSnapshot('session_1', 'name1', 'desc1', 0, 'serialized1'),
      _toSnapshot('session_1', 'name2', 'desc2', 0, 'serialized2'),
      _toSnapshot('session_2', 'name3', 'desc3', 0, 'serialized3')
    ];

    backupDatabase = new pskl.database.BackupDatabase();
    backupDatabase.init()
      .then(function () {
        return _addSnapshots(testSnapshots);
      }).then(function () {
        // Retrieve snapshots to get the inserted snapshot id
        return backupDatabase.getSnapshotsBySessionId('session_1');
      }).then(function (snapshots) {
        // Check that we have 2 snapshots for session_1
        expect(snapshots.length).toBe(2);
        // Delete snapshots for session_1
        return backupDatabase.deleteSnapshotsForSession('session_1');
      }).then(function () {
        // Get snapshots for session_1 in backup database
        return backupDatabase.getSnapshotsBySessionId('session_1');
      }).then(function (snapshots) {
        // All snapshots should have been deleted
        expect(snapshots.length).toBe(0);
        // Get snapshots for session_2 in backup database
        return backupDatabase.getSnapshotsBySessionId('session_2');
      }).then(function (snapshots) {
        // There should still be the snapshot for session_2
        expect(snapshots.length).toBe(1);
        _checkSnapshot(snapshots[0], testSnapshots[2]);
        done();
      });
  });

  it('does a noop when calling deleteAllSnapshotsForSession for a missing session', function (done) {
    backupDatabase = new pskl.database.BackupDatabase();
    backupDatabase.init()
      .then(function () {
        // Delete snapshot with 'name1' from backup database
        return backupDatabase.deleteSnapshotsForSession('session_1');
      }).then(function () {
        done();
      });
  });

  it('returns sessions array when calling getSessions', function (done) {
    var testSnapshots = [
      _toSnapshot('session_1', 'name1', 'desc1', 5, 'serialized1'),
      _toSnapshot('session_1', 'name2', 'desc2', 10, 'serialized2'),
      _toSnapshot('session_2', 'name3', 'desc3', 15, 'serialized3')
    ];

    backupDatabase = new pskl.database.BackupDatabase();
    backupDatabase.init()
      .then(function () {
        return _addSnapshots(testSnapshots);
      }).then(function () {
        return backupDatabase.getSessions();
      }).then(function (sessions) {
        // Check that we have 2 sessions
        expect(sessions.length).toBe(2);

        // Get the actual sessions
        var session1 = sessions.filter(function (s) { return s.id === 'session_1'; })[0];
        var session2 = sessions.filter(function (s) { return s.id === 'session_2'; })[0];

        // Check the start/end date were computed properly
        expect(session1.startDate).toBe(5);
        expect(session1.endDate).toBe(10);
        expect(session2.startDate).toBe(15);
        expect(session2.endDate).toBe(15);

        done();
      });
  });

  it('returns an empty array when calling getSessions on an empty DB', function (done) {
    backupDatabase = new pskl.database.BackupDatabase();
    backupDatabase.init()
      .then(function () {
        return backupDatabase.getSessions();
      }).then(function (sessions) {
        expect(sessions.length).toBe(0);
        done();
      });
  });
});
