(function () {
  var ns = $.namespace('pskl.service');

  var DB_NAME = 'PiskelSessionsDatabase';
  var DB_VERSION = 1;

  var ONE_SECOND = 1000;
  var ONE_MINUTE = 60 * ONE_SECOND;

  // Save every minute = 1000 * 60
  var BACKUP_INTERVAL = ONE_MINUTE;
  // Store a new snapshot every 5 minutes.
  var SNAPSHOT_INTERVAL = ONE_MINUTE * 5;
  // Store up to 12 snapshots for a piskel session, min. 1 hour of work
  var MAX_SNAPSHOTS_PER_SESSION = 12;

  var _requestPromise = function (req) {
    var deferred = Q.defer();
    req.onsuccess = deferred.resolve.bind(deferred);
    req.onerror = deferred.reject.bind(deferred);
    return deferred.promise;
  };

  ns.BackupService = function (piskelController) {
    this.piskelController = piskelController;
    this.lastHash = null;
    this.nextSnapshotDate = -1;
  };

  ns.BackupService.prototype.init = function () {
    var request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = this.onRequestError_.bind(this);
    request.onupgradeneeded = this.onUpgradeNeeded_.bind(this);
    request.onsuccess = this.onRequestSuccess_.bind(this);
  };

  ns.BackupService.prototype.onRequestError_ = function (event) {
    console.log('Could not initialize the piskel backup database');
  };

  ns.BackupService.prototype.onUpgradeNeeded_ = function (event) {
    // Set this.db early to allow migration scripts to access it in oncomplete.
    this.db = event.target.result;

    // Create an object store "piskels" with the autoIncrement flag set as true.
    var objectStore = this.db.createObjectStore('snapshots', { keyPath: 'id', autoIncrement : true });

    objectStore.createIndex('session_id', 'session_id', { unique: false });
    objectStore.createIndex('date', 'date', { unique: false });
    objectStore.createIndex('session_id, date', ['session_id', 'date'], { unique: false });

    objectStore.transaction.oncomplete = function(event) {
      // TODO: Migrate existing data from local storage?
    };
  };

  ns.BackupService.prototype.onRequestSuccess_ = function (event) {
    this.db = event.target.result;
    window.setInterval(this.backup.bind(this), BACKUP_INTERVAL);
  };

  ns.BackupService.prototype.openObjectStore_ = function () {
    return this.db.transaction(['snapshots'], 'readwrite').objectStore('snapshots');
  };

  ns.BackupService.prototype.createSnapshot = function (snapshot) {
    var objectStore = this.openObjectStore_();
    var request = objectStore.add(snapshot);
    return _requestPromise(request);
  };

  ns.BackupService.prototype.replaceSnapshot = function (snapshot, replacedSnapshot) {
    snapshot.id = replacedSnapshot.id;

    var objectStore = this.openObjectStore_();
    var request = objectStore.put(snapshot);
    return _requestPromise(request);
  };

  ns.BackupService.prototype.deleteSnapshot = function (snapshot) {
    var objectStore = this.openObjectStore_();
    var request = objectStore.delete(snapshot.id);
    return _requestPromise(request);
  };

  ns.BackupService.prototype.getSnapshotsBySessionId_ = function (sessionId) {
    // Create the backup promise.
    var deferred = Q.defer();

    // Open a transaction to the snapshots object store.
    var objectStore = this.db.transaction(['snapshots']).objectStore('snapshots');

    // Loop on all the saved snapshots for the provided piskel id
    var index = objectStore.index('session_id, date');
    var keyRange = IDBKeyRange.bound(
      [sessionId, 0],
      [sessionId, Infinity]
    );

    var snapshots = [];
    // Ordered by date in descending order.
    index.openCursor(keyRange, 'prev').onsuccess = function(event) {
      var cursor = event.target.result;
      if (cursor) {
        snapshots.push(cursor.value);
        cursor.continue();
      } else {
        console.log('consumed all piskel snapshots');
        deferred.resolve(snapshots);
      }
    };

    return deferred.promise;
  };

  ns.BackupService.prototype.backup = function () {
    var piskel = this.piskelController.getPiskel();
    var hash = piskel.getHash();

    // Do not save an unchanged piskel
    if (hash === this.lastHash) {
      return;
    }

    // Update the hash
    // TODO: should only be done after a successfull save.
    this.lastHash = hash;

    // Prepare the backup snapshot.
    var descriptor = piskel.getDescriptor();
    var date = Date.now();
    var snapshot = {
      session_id: piskel.sessionId,
      date: date,
      name: descriptor.name,
      description: descriptor.description,
      serialized: pskl.utils.serialization.Serializer.serialize(piskel)
    };

    this.getSnapshotsBySessionId_(piskel.sessionId).then(function (snapshots) {
      var latest = snapshots[0];

      if (latest && date < this.nextSnapshotDate) {
        // update the latest snapshot
        return this.replaceSnapshot(snapshot, latest);
      } else {
        // add a new snapshot
        this.nextSnapshotDate = date + SNAPSHOT_INTERVAL;
        return this.createSnapshot(snapshot).then(function () {
          if (snapshots.length >= MAX_SNAPSHOTS_PER_SESSION) {
            // remove oldest snapshot
            return this.deleteSnapshot(snapshots[snapshots.length - 1]);
          }
        }.bind(this));
      }
    }.bind(this)).catch(function (e) {
      console.log('Backup failed');
      console.error(e);
    });
  };

  ns.BackupService.prototype.getPreviousPiskelInfo = function () {
    // Create the backup promise.
    var deferred = Q.defer();

    // Open a transaction to the snapshots object store.
    var objectStore = this.db.transaction(['snapshots']).objectStore('snapshots');

    var sessionId = this.piskelController.getPiskel().sessionId;
    var index = objectStore.index('date');
    var range = IDBKeyRange.upperBound(Infinity);
    index.openCursor(range, 'prev').onsuccess = function(event) {
      var cursor = event.target.result;
      var snapshot = cursor && cursor.value;
      if (snapshot && snapshot.session_id === sessionId) {
        // Skip snapshots for the current session.
        cursor.continue();
      } else {
        deferred.resolve(snapshot);
      }
    };

    return deferred.promise;
  };

  ns.BackupService.prototype.load = function() {
    this.getPreviousPiskelInfo().then(function (snapshot) {
      pskl.utils.serialization.Deserializer.deserialize(
        JSON.parse(snapshot.serialized),
        function (piskel) {
          pskl.app.piskelController.setPiskel(piskel);
        }
      );
    });
  };
})();
