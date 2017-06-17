(function () {
  var ns = $.namespace('pskl.service');

  var ONE_SECOND = 1000;
  var ONE_MINUTE = 60 * ONE_SECOND;

  // Save every minute = 1000 * 60
  var BACKUP_INTERVAL = ONE_MINUTE;
  // Store a new snapshot every 5 minutes.
  var SNAPSHOT_INTERVAL = ONE_MINUTE * 5;
  // Store up to 12 snapshots for a piskel session, min. 1 hour of work
  var MAX_SNAPSHOTS_PER_SESSION = 12;
  var MAX_SESSIONS = 10;

  ns.BackupService = function (piskelController, backupDatabase) {
    this.piskelController = piskelController;
    this.lastHash = null;
    this.nextSnapshotDate = -1;

    // backupDatabase can be provided for testing purposes.
    this.backupDatabase = backupDatabase || new pskl.database.BackupDatabase();
  };

  ns.BackupService.prototype.init = function () {
    this.backupDatabase.init().then(function () {
      window.setInterval(this.backup.bind(this), BACKUP_INTERVAL);
    }.bind(this));
  };

  // This is purely exposed for testing, so that backup dates can be set programmatically.
  ns.BackupService.prototype.currentDate_ = function () {
    return Date.now();
  };

  ns.BackupService.prototype.backup = function () {
    var piskel = this.piskelController.getPiskel();
    var hash = piskel.getHash();

    // Do not save an unchanged piskel
    if (hash === this.lastHash) {
      return Q.resolve();
    }

    // Update the hash
    // TODO: should only be done after a successfull save.
    this.lastHash = hash;

    // Prepare the backup snapshot.
    var descriptor = piskel.getDescriptor();
    var date = this.currentDate_();
    var snapshot = {
      session_id: piskel.sessionId,
      date: date,
      name: descriptor.name,
      description: descriptor.description,
      serialized: pskl.utils.serialization.Serializer.serialize(piskel)
    };

    return this.backupDatabase.getSnapshotsBySessionId(piskel.sessionId).then(function (snapshots) {
      var latest = snapshots[0];

      if (latest && date < this.nextSnapshotDate) {
        // update the latest snapshot
        snapshot.id = latest.id;
        return this.backupDatabase.updateSnapshot(snapshot);
      } else {
        // add a new snapshot
        this.nextSnapshotDate = date + SNAPSHOT_INTERVAL;
        return this.backupDatabase.createSnapshot(snapshot).then(function () {
          if (snapshots.length >= MAX_SNAPSHOTS_PER_SESSION) {
            // remove oldest snapshot
            return this.backupDatabase.deleteSnapshot(snapshots[snapshots.length - 1]);
          }
        }.bind(this)).then(function () {
          var isNewSession = !latest;
          if (!isNewSession) {
            return;
          }
          return this.backupDatabase.getSessions().then(function (sessions) {
            if (sessions.length <= MAX_SESSIONS) {
              // If MAX_SESSIONS has not been reached, no need to delete
              // previous sessions.
              return;
            }

            var oldestSession = sessions.sort(function (s1, s2) {
              return s1.startDate - s2.startDate;
            })[0].id;

            return this.backupDatabase.deleteSnapshotsForSession(oldestSession);
          }.bind(this));
        }.bind(this));
      }
    }.bind(this)).catch(function (e) {
      console.error(e);
    });
  };

  ns.BackupService.prototype.getPreviousPiskelInfo = function () {
    var sessionId = this.piskelController.getPiskel().sessionId;
    return this.backupDatabase.findLastSnapshot(function (snapshot) {
      return snapshot.session_id !== sessionId;
    });
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
