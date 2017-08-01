describe('BackupService test', function () {
  // Some helper const.
  var ONE_SECOND = 1000;
  var ONE_MINUTE = 60 * ONE_SECOND;

  var mockBackupDatabase;
  var mockPiskel;
  var mockPiskelController;

  // Globals used in stubs
  var stubValues = {
    snapshotDate: null,
    serializedPiskel: null
  };

  // Main test object.
  var backupService;

  beforeEach(function () {
    // Create mocks.
    mockBackupDatabase = {
      // Test property
      _sessions: {},
      init: function () {},
      getSnapshotsBySessionId: function (sessionId) {
        // Default implementation that looks up in _sessions or returns an
        // empty array.
        return Promise.resolve(this._sessions[sessionId] || []);
      },
      updateSnapshot: function () { return Promise.resolve(); },
      createSnapshot: function () { return Promise.resolve(); },
      deleteSnapshot: function () { return Promise.resolve(); },
      getSessions: function () { return Promise.resolve([]); },
      deleteSnapshotsForSession: function () { return Promise.resolve(); },
      findLastSnapshot: function () { return Promise.resolve(null); }
    };

    mockPiskel = {
      _descriptor: {},
      _hash: null,
      getDescriptor: function () { return this._descriptor; },
      getHash: function () { return this._hash; },
      getWidth: function () { return 32; },
      getHeight: function () { return 32; },
      getFrameCount: function () { return 1; },
      getFPS: function () { return 12; },
    };

    mockPiskelController = {
      getPiskel: function () { return mockPiskel; },
      setPiskel: function () {}
    };

    spyOn(pskl.utils.serialization.Serializer, 'serialize').and.callFake(function () {
      return stubValues.serializedPiskel;
    });

    // Create test backup service with mocks.
    backupService = new pskl.service.BackupService(
      mockPiskelController,
      mockBackupDatabase
    );
    // Override the currentDate_ internal helper in order to set
    // custom snapshot dates.
    backupService.currentDate_ = function () {
      return snapshotDate;
    }
  });

  var createSnapshotObject = function (session_id, name, description, date, serialized) {
    return {
      session_id: session_id,
      name: name,
      description: description,
      date: date,
      serialized: serialized
    };
  };

  var preparePiskelMocks = function (session_id, name, description, hash, serialized) {
    // Update the session id.
    pskl.app.sessionId = session_id;

    // Update the piskel mock.
    mockPiskel._descriptor.name = name;
    mockPiskel._descriptor.description = description;
    mockPiskel._hash = hash;
    stubValues.serializedPiskel = serialized;
  };

  it('calls create to backup', function (done) {
    preparePiskelMocks(1, 'piskel_name', 'piskel_desc', 'piskel_hash', 'serialized');

    // Set snashot date.
    snapshotDate = 5;

    // No snapshots currently saved.
    spyOn(mockBackupDatabase, 'createSnapshot').and.callThrough();

    backupService.backup().then(function () {
      expect(mockBackupDatabase.createSnapshot).toHaveBeenCalled();
      var snapshot = mockBackupDatabase.createSnapshot.calls.mostRecent().args[0]
      expect(snapshot.session_id).toEqual(1);
      expect(snapshot.name).toEqual('piskel_name');
      expect(snapshot.description).toEqual('piskel_desc');
      expect(snapshot.date).toEqual(5);
      expect(snapshot.serialized).toEqual('serialized');
      done();
    });
  });

  it('does not call update to backup if the hash did not change', function (done) {
    var session = 1;
    var date1 = 0;
    var date2 = ONE_MINUTE;

    var snapshot1 = createSnapshotObject(1, 'piskel_name1', 'piskel_desc1', date1, 'serialized1');
    preparePiskelMocks(session, 'piskel_name1', 'piskel_desc1', 'hash', 'serialized1');
    snapshotDate = date1;

    // Prepare spies.
    spyOn(mockBackupDatabase, 'updateSnapshot').and.callThrough();
    spyOn(mockBackupDatabase, 'createSnapshot').and.callThrough();

    backupService.backup().then(function () {
      // The snapshot should have been created using "createSnapshot".
      expect(mockBackupDatabase.createSnapshot).toHaveBeenCalled();
      expect(mockBackupDatabase.updateSnapshot.calls.any()).toBe(false);

      // Prepare snapshot1 to be returned in the list of already existing sessions.
      mockBackupDatabase._sessions[session] = [snapshot1];

      preparePiskelMocks(session, 'piskel_name2', 'piskel_desc2', 'hash', 'serialized2');
      snapshotDate = date2;

      backupService.backup().then(function () {
        // Check that createSnapshot was not called again and updateSnapshot either.
        expect(mockBackupDatabase.createSnapshot.calls.count()).toEqual(1);
        expect(mockBackupDatabase.updateSnapshot.calls.count()).toEqual(0);
        done();
      });
    });
  });

  it('calls update to backup if there is an existing & recent snapshot', function (done) {
    var session = 1;
    var date1 = 0;
    var date2 = ONE_MINUTE;

    var snapshot1 = createSnapshotObject(1, 'piskel_name1', 'piskel_desc1', date1, 'serialized1');
    preparePiskelMocks(session, 'piskel_name1', 'piskel_desc1', 'piskel_hash1', 'serialized1');
    snapshotDate = date1;

    // Prepare spies.
    spyOn(mockBackupDatabase, 'updateSnapshot').and.callThrough();
    spyOn(mockBackupDatabase, 'createSnapshot').and.callThrough();

    backupService.backup().then(function () {
      // The snapshot should have been created using "createSnapshot".
      expect(mockBackupDatabase.createSnapshot).toHaveBeenCalled();

      // Prepare snapshot1 to be returned in the list of already existing sessions.
      mockBackupDatabase._sessions[session] = [snapshot1];

      preparePiskelMocks(session, 'piskel_name2', 'piskel_desc2', 'piskel_hash2', 'serialized2');
      snapshotDate = date2;

      backupService.backup().then(function () {
        // Check that createSnapshot was not called again.
        expect(mockBackupDatabase.createSnapshot.calls.count()).toEqual(1);
        // Check that updateSnapshot was called with the expected arguments.
        expect(mockBackupDatabase.updateSnapshot).toHaveBeenCalled();
        var snapshot = mockBackupDatabase.updateSnapshot.calls.mostRecent().args[0]
        expect(snapshot.session_id).toEqual(session);
        expect(snapshot.name).toEqual('piskel_name2');
        expect(snapshot.description).toEqual('piskel_desc2');
        expect(snapshot.date).toEqual(date2);
        expect(snapshot.serialized).toEqual('serialized2');
        done();
      });
    });
  });

  it('creates a new snapshot if the time difference is big enough', function (done) {
    var session = 1;
    var date1 = 0;
    var date2 = 6 * ONE_MINUTE;

    var snapshot1 = createSnapshotObject(1, 'piskel_name1', 'piskel_desc1', date1, 'serialized1');
    preparePiskelMocks(session, 'piskel_name1', 'piskel_desc1', 'piskel_hash1', 'serialized1');
    snapshotDate = date1;

    // Prepare spies.
    spyOn(mockBackupDatabase, 'updateSnapshot').and.callThrough();
    spyOn(mockBackupDatabase, 'createSnapshot').and.callThrough();

    backupService.backup().then(function () {
      // The snapshot should have been created using "createSnapshot".
      expect(mockBackupDatabase.createSnapshot).toHaveBeenCalled();

      // Prepare snapshot1 to be returned in the list of already existing sessions.
      mockBackupDatabase._sessions[session] = [snapshot1];

      preparePiskelMocks(session, 'piskel_name2', 'piskel_desc2', 'piskel_hash2', 'serialized2');
      snapshotDate = date2;

      backupService.backup().then(function () {
        // Check that updateSnapshot was not called.
        expect(mockBackupDatabase.updateSnapshot.calls.count()).toEqual(0);
        // Check that updateSnapshot was called with the expected arguments.
        expect(mockBackupDatabase.createSnapshot).toHaveBeenCalled();
        var snapshot = mockBackupDatabase.createSnapshot.calls.mostRecent().args[0]
        expect(snapshot.session_id).toEqual(session);
        expect(snapshot.name).toEqual('piskel_name2');
        expect(snapshot.description).toEqual('piskel_desc2');
        expect(snapshot.date).toEqual(date2);
        expect(snapshot.serialized).toEqual('serialized2');
        done();
      });
    });
  });

  it('deletes old snapshots if there are too many of them', function (done) {
    var session = 1;
    var maxPerSession = 12;

    preparePiskelMocks(session, 'piskel_name', 'piskel_desc', 'piskel_hash', 'serialized12');
    snapshotDate = 12 * 6 * ONE_MINUTE;

    // Prepare spies.
    spyOn(mockBackupDatabase, 'deleteSnapshot').and.callThrough();
    spyOn(mockBackupDatabase, 'createSnapshot').and.callThrough();

    // Prepare array of already saved snapshots.
    mockBackupDatabase._sessions[session] = [];
    for (var i = maxPerSession - 1 ; i >= 0 ; i--) {
      mockBackupDatabase._sessions[session].push(
        createSnapshotObject(session, 'piskel_name', 'piskel_desc', i * 6 * ONE_MINUTE, 'serialized' + i)
      );
    }

    backupService.backup().then(function () {
      expect(mockBackupDatabase.createSnapshot).toHaveBeenCalled();
      expect(mockBackupDatabase.deleteSnapshot).toHaveBeenCalled();
      // It will simply attempt to delete the last item from the array of saved sessions
      var snapshot = mockBackupDatabase.deleteSnapshot.calls.mostRecent().args[0];
      expect(snapshot.session_id).toEqual(session);
      expect(snapshot.name).toEqual('piskel_name');
      expect(snapshot.description).toEqual('piskel_desc');
      expect(snapshot.date).toEqual(0);
      expect(snapshot.serialized).toEqual('serialized0');
      done();
    });
  });

  it('deletes a session if there are too many of them', function (done) {
    var session = 'session10';
    var maxSessions = 10;

    preparePiskelMocks(session, 'piskel_name', 'piskel_desc', 'piskel_hash', 'serialized12');
    snapshotDate = 10 * ONE_MINUTE;

    // Prepare array of sessions.
    var sessions = [];
    for (var i = 0 ; i < maxSessions + 1 ; i++) {
      sessions.push({
        id: 'session' + i,
        startDate: i * ONE_MINUTE
      });
    }

    // Prepare spies.
    spyOn(mockBackupDatabase, 'getSessions').and.returnValue(Promise.resolve(sessions));
    spyOn(mockBackupDatabase, 'createSnapshot').and.callThrough();
    spyOn(mockBackupDatabase, 'deleteSnapshotsForSession').and.callThrough();

    backupService.backup().then(function () {
      expect(mockBackupDatabase.createSnapshot).toHaveBeenCalled();
      expect(mockBackupDatabase.deleteSnapshotsForSession).toHaveBeenCalled();
      // It will simply attempt to delete the last item from the array of saved sessions
      var sessionId = mockBackupDatabase.deleteSnapshotsForSession.calls.mostRecent().args[0];
      expect(sessionId).toEqual('session0');
      done();
    });
  });
});