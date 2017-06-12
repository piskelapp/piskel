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

  ns.BackupService = function (piskelController) {
    this.piskelController = piskelController;
    this.lastHash = null;
    this.nextSnapshotDate = -1;

    this.backupDatabase = new pskl.database.BackupDatabase();
  };

  ns.BackupService.prototype.init = function () {
    this.backupDatabase.init().then(function () {
      window.setInterval(this.backup.bind(this), BACKUP_INTERVAL);
    }.bind(this));
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

    this.backupDatabase.getSnapshotsBySessionId(piskel.sessionId).then(function (snapshots) {
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
        }.bind(this));
      }
    }.bind(this)).catch(function (e) {
      console.log('Backup failed');
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
