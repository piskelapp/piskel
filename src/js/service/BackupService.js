(function () {
  var ns = $.namespace('pskl.service');

  // 1 minute = 1000 * 60
  var BACKUP_INTERVAL = 1000 * 60;

  ns.BackupService = function (piskelController) {
    this.piskelController = piskelController;
    this.lastHash = null;
  };

  ns.BackupService.prototype.init = function () {
    var previousPiskel = window.localStorage.getItem('bkp.next.piskel');
    var previousInfo = window.localStorage.getItem('bkp.next.info');
    if (previousPiskel && previousInfo) {
      this.savePiskel_('prev', previousPiskel, previousInfo);
    }

    window.setInterval(this.backup.bind(this), BACKUP_INTERVAL);
  };

  ns.BackupService.prototype.backup = function () {
    var piskel = this.piskelController.getPiskel();
    var descriptor = piskel.getDescriptor();
    var hash = piskel.getHash();
    var info = {
      name : descriptor.name,
      description : descriptor.info,
      fps : this.piskelController.getFPS(),
      date : Date.now(),
      hash : hash
    };

    // Do not save an unchanged piskel
    if (hash !== this.lastHash) {
      this.lastHash = hash;
      this.savePiskel_('next', this.piskelController.serialize(), JSON.stringify(info));
    }
  };

  ns.BackupService.prototype.getPreviousPiskelInfo = function () {
    var previousInfo = window.localStorage.getItem('bkp.prev.info');
    if (previousInfo) {
      return JSON.parse(previousInfo);
    }
  };

  ns.BackupService.prototype.load = function() {

    var previousPiskel = window.localStorage.getItem('bkp.prev.piskel');
    var previousInfo = window.localStorage.getItem('bkp.prev.info');

    previousPiskel = JSON.parse(previousPiskel);
    previousInfo = JSON.parse(previousInfo);

    pskl.utils.serialization.Deserializer.deserialize(previousPiskel, function (piskel) {
      piskel.setDescriptor(new pskl.model.piskel.Descriptor(previousInfo.name, previousInfo.description, true));
      pskl.app.piskelController.setPiskel(piskel);
      pskl.app.previewController.setFPS(previousInfo.fps);
    });
  };

  ns.BackupService.prototype.savePiskel_ = function (type, piskel, info) {
    try {
      window.localStorage.setItem('bkp.' + type +'.piskel', piskel);
      window.localStorage.setItem('bkp.' + type +'.info', info);
    } catch (e) {
      console.error('Could not save piskel backup in localStorage.', e);
    }
  };
})();




