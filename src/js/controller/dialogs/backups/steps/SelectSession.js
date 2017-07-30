(function () {
  var ns = $.namespace('pskl.controller.dialogs.backups.steps');

  /**
   * Helper that returns a promise that will resolve after waiting for a
   * given time (in ms).
   *
   * @param {Number} time
   *        The time to wait.
   * @return {Promise} promise that resolves after time.
   */
  var wait = function (time) {
    var deferred = Q.defer();
    setTimeout(function () {
      deferred.resolve();
    }, time);
    return deferred.promise;
  };

  ns.SelectSession = function (piskelController, backupsController, container) {
    this.piskelController = piskelController;
    this.backupsController = backupsController;
    this.container = container;
  };

  ns.SelectSession.prototype.addEventListener = function (el, type, cb) {
    pskl.utils.Event.addEventListener(el, type, cb, this);
  };

  ns.SelectSession.prototype.init = function () {
    this.addEventListener(this.container, 'click', this.onContainerClick_);
  };

  ns.SelectSession.prototype.onShow = function () {
    this.update();
  };

  ns.SelectSession.prototype.update = function () {
    pskl.app.backupService.list().then(function (sessions) {
      var html = '';
      if (sessions.length === 0) {
        html = 'No session found ...';
      } else {
        var sessionItemTemplate = pskl.utils.Template.get('session-list-item');
        var html = '';
        sessions.forEach(function (session) {
          var view = {
            id: session.id,
            name: session.name,
            description: session.description ? '- ' + session.description : '',
            date: pskl.utils.DateUtils.format(session.endDate, 'the {{Y}}/{{M}}/{{D}} at {{H}}:{{m}}'),
            count: session.count === 1 ? '1 snapshot' : session.count + ' snapshots'
          };
          html += pskl.utils.Template.replace(sessionItemTemplate, view);
        });
      }
      this.container.querySelector('.session-list').innerHTML = html;
    }.bind(this));
  };

  ns.SelectSession.prototype.destroy = function () {
    pskl.utils.Event.removeAllEventListeners(this);
  };

  ns.SelectSession.prototype.onContainerClick_ = function (evt) {
    var sessionId = evt.target.dataset.sessionId;
    if (!sessionId) {
      return;
    }

    var action = evt.target.dataset.action;
    if (action == 'view') {
      this.backupsController.mergeData.selectedSession = sessionId;
      this.backupsController.next();
    } else if (action == 'delete') {
      if (window.confirm('Are you sure you want to delete this session?')) {
        evt.target.closest('.session-item').classList.add('deleting');
        Q.all([
          pskl.app.backupService.deleteSession(sessionId),
          // Wait for 500ms for the .hide opacity transition.
          wait(500)
        ]).then(function () {
          // Refresh the list of sessions
          this.update();
        }.bind(this));
      }
    }
  };

})();
