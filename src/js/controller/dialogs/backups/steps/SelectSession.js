(function () {
  var ns = $.namespace('pskl.controller.dialogs.backups.steps');

  // Should match the transition duration for.session-item defined in dialogs-browse-backups.css
  var DELETE_TRANSITION_DURATION = 500;
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
      var html = this.getMarkupForSessions_(sessions);
      this.container.querySelector('.session-list').innerHTML = html;
    }.bind(this)).catch(function () {
      var html = pskl.utils.Template.get('session-list-error');
      this.container.querySelector('.session-list').innerHTML = html;
    }.bind(this));
  };

  ns.SelectSession.prototype.getMarkupForSessions_ = function (sessions) {
    if (sessions.length === 0) {
      return pskl.utils.Template.get('session-list-empty');
    }

    var sessionItemTemplate = pskl.utils.Template.get('session-list-item');
    return sessions.reduce(function (previous, session) {
      if (session.id === pskl.app.sessionId) {
        // Do not show backups for the current session.
        return previous;
      }
      var view = {
        id: session.id,
        name: session.name,
        description: session.description ? '- ' + session.description : '',
        date: pskl.utils.DateUtils.format(session.endDate, 'the {{Y}}/{{M}}/{{D}} at {{H}}:{{m}}'),
        count: session.count === 1 ? '1 snapshot' : session.count + ' snapshots'
      };
      return previous + pskl.utils.Template.replace(sessionItemTemplate, view);
    }, '');
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
      this.backupsController.backupsData.selectedSession = sessionId;
      this.backupsController.next();
    } else if (action == 'delete') {
      if (window.confirm('Are you sure you want to delete this session?')) {
        evt.target.closest('.session-item').classList.add('deleting');
        Q.all([
          pskl.app.backupService.deleteSession(sessionId),
          // Wait for 500ms for the .hide opacity transition.
          wait(DELETE_TRANSITION_DURATION)
        ]).then(function () {
          // Refresh the list of sessions
          this.update();
        }.bind(this));
      }
    }
  };

})();
