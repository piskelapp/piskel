(function () {
  var ns = $.namespace('pskl.controller.dialogs.backups.steps');

  ns.SessionDetails = function (piskelController, backupsController, container) {
    this.piskelController = piskelController;
    this.backupsController = backupsController;
    this.container = container;
  };

  ns.SessionDetails.prototype.init = function () {
    this.backButton = this.container.querySelector('.back-button');
    this.addEventListener(this.backButton, 'click', this.onBackClick_);
    this.addEventListener(this.container, 'click', this.onContainerClick_);
  };

  ns.SessionDetails.prototype.destroy = function () {
    pskl.utils.Event.removeAllEventListeners(this);
  };

  ns.SessionDetails.prototype.addEventListener = function (el, type, cb) {
    pskl.utils.Event.addEventListener(el, type, cb, this);
  };

  ns.SessionDetails.prototype.onShow = function () {
    var sessionId = this.backupsController.mergeData.selectedSession;
    pskl.app.backupService.getSnapshotsBySessionId(sessionId).then(function (snapshots) {
      var html = '';
      if (snapshots.length === 0) {
        // This should normally never happen, all sessions have at least one snapshot and snapshots
        // can not be individually deleted.
        console.warn('Could not retrieve snapshots for a session');
        html = pskl.utils.Template.get('snapshot-list-empty');
      } else {
        var sessionItemTemplate = pskl.utils.Template.get('snapshot-list-item');
        var html = '';
        snapshots.forEach(function (snapshot) {
          var view = {
            id: snapshot.id,
            name: snapshot.name,
            description: snapshot.description ? '- ' + snapshot.description : '',
            date: pskl.utils.DateUtils.format(snapshot.date, 'the {{Y}}/{{M}}/{{D}} at {{H}}:{{m}}'),
            frames: snapshot.frames === 1 ? '1 frame' : snapshot.frames + ' frames',
            resolution: pskl.utils.StringUtils.formatSize(snapshot.width, snapshot.height),
            fps: snapshot.fps
          };
          html += pskl.utils.Template.replace(sessionItemTemplate, view);
        });
      }
      this.container.querySelector('.snapshot-list').innerHTML = html;
    }.bind(this));
  };

  ns.SessionDetails.prototype.onBackClick_ = function () {
    this.backupsController.back(this);
  };

  ns.SessionDetails.prototype.onContainerClick_ = function (evt) {
    var action = evt.target.dataset.action;
    if (action == 'load') {
      var snapshotId = evt.target.dataset.snapshotId * 1;
      pskl.app.backupService.loadSnapshotById(snapshotId).then(function () {
        $.publish(Events.DIALOG_HIDE);
      });
    }
  };
})();
