(function () {
  var ns = $.namespace('pskl.service');
  var BACKUP_INTERVAL = 1000 * 60;

  ns.BackupService = function (piskelController) {
    this.piskelController = piskelController;
    this.lastHash = null;
  };

  ns.BackupService.prototype.init = function () {
    var previousPiskel = window.localStorage.getItem('bkp.next.piskel');
    var previousInfo = window.localStorage.getItem('bkp.next.info');
    if (previousPiskel && previousInfo) {
      window.localStorage.setItem('bkp.prev.piskel', previousPiskel);
      window.localStorage.setItem('bkp.prev.info', previousInfo);
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
      window.localStorage.setItem('bkp.next.piskel', this.piskelController.serialize());
      window.localStorage.setItem('bkp.next.info', JSON.stringify(info));
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
      pskl.app.animationController.setFPS(previousInfo.fps);
    });
  };
})();
