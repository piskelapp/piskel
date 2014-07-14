(function () {
  var ns = $.namespace('pskl.controller.dialogs');

  ns.BrowseLocalController = function (piskelController) {
  };

  pskl.utils.inherit(ns.BrowseLocalController, ns.AbstractDialogController);

  ns.BrowseLocalController.prototype.init = function () {
    this.superclass.init.call(this);

    this.localStorageItemTemplate_ = pskl.utils.Template.get("local-storage-item-template");

    this.service_ = pskl.app.localStorageService;
    this.piskelList = $('.local-piskel-list');
    this.prevSessionContainer = $('.previous-session');

    this.fillLocalPiskelsList_();

    this.piskelList.click(this.onPiskelsListClick_.bind(this));
  };

  ns.BrowseLocalController.prototype.onPiskelsListClick_ = function (evt) {
    var action = evt.target.getAttribute('data-action');
    var name = evt.target.getAttribute('data-name');
    if (action === 'load') {
      if (window.confirm('This will erase your current piskel. Continue ?')) {
        this.service_.load(name);
        this.closeDialog();
      }
    } else if (action === 'delete') {
      if (window.confirm('This will permanently DELETE this piskel from your computer. Continue ?')) {
        this.service_.remove(name);
        this.fillLocalPiskelsList_();
      }
    }
  };

  ns.BrowseLocalController.prototype.fillLocalPiskelsList_ = function () {
    var html = "";
    var keys = this.service_.getKeys();

    keys.sort(function (k1, k2) {
      if (k1.date < k2.date) {return 1;}
      if (k1.date > k2.date) {return -1;}
      return 0;
    });

    keys.forEach((function (key) {
      var date = pskl.utils.DateUtils.format(key.date, "{{Y}}/{{M}}/{{D}} {{H}}:{{m}}");
      html += pskl.utils.Template.replace(this.localStorageItemTemplate_, {name : key.name, date : date});
    }).bind(this));

    var tableBody_ = this.piskelList.get(0).tBodies[0];
    tableBody_.innerHTML = html;
  };
})();