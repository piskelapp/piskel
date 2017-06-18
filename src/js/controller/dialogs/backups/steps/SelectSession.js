(function () {
  var ns = $.namespace('pskl.controller.dialogs.backups.steps');

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
          html += pskl.utils.Template.replace(sessionItemTemplate, session);
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
      pskl.app.backupService.deleteSession(sessionId).then(function () {
        // Refresh the list of sessions
        this.update();
      }.bind(this));
    }
  };

})();
