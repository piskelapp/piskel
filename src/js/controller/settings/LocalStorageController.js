(function () {
  var ns = $.namespace("pskl.controller.settings");

  ns.LocalStorageController = function () {};

  /**
   * @public
   */
  ns.LocalStorageController.prototype.init = function() {
    this.localStorageItemTemplate_ = pskl.utils.Template.get("local-storage-item-template");
    this.previousSessionTemplate_ = pskl.utils.Template.get("previous-session-info-template");

    this.service_ = pskl.app.localStorageService;
    this.piskelsList = $('.local-piskels-list');
    this.prevSessionContainer = $('.previous-session');

    this.fillRestoreSession_();
    this.fillLocalPiskelsList_();

    this.piskelsList.click(this.onPiskelsListClick_.bind(this));
  };

  ns.LocalStorageController.prototype.onPiskelsListClick_ = function (evt) {
    var action = evt.target.getAttribute('data-action');
    var name = evt.target.getAttribute('data-name');
    if (action === 'load') {
      if (window.confirm('This will erase your current piskel. Continue ?')) {
        this.service_.load(name);
        $.publish(Events.CLOSE_SETTINGS_DRAWER);
      }
    } else if (action === 'delete') {
      if (window.confirm('This will permanently DELETE this piskel from your computer. Continue ?')) {
        this.service_.remove(name);
        this.fillLocalPiskelsList_();
      }
    }
  };

  ns.LocalStorageController.prototype.fillRestoreSession_ = function () {
    var previousInfo = pskl.app.backupService.getPreviousPiskelInfo();
    if (previousInfo) {
      var info = {
        name : previousInfo.name,
        date : this.formatDate_(previousInfo.date, "{{H}}:{{m}} - {{Y}}/{{M}}/{{D}}")
      };

      this.prevSessionContainer.html(pskl.utils.Template.replace(this.previousSessionTemplate_, info));
      $(".restore-session-button").click(this.onRestorePreviousSessionClick_.bind(this));
    } else {
      this.prevSessionContainer.html("No piskel backup was found on this browser.");
    }
  };

  ns.LocalStorageController.prototype.onRestorePreviousSessionClick_ = function () {
    if (window.confirm('This will erase your current workspace. Continue ?')) {
      pskl.app.backupService.load();
      $.publish(Events.CLOSE_SETTINGS_DRAWER);
    }
  };

  var pad = function (num) {
    if (num < 10) {
      return "0" + num;
    } else {
      return "" + num;
    }
  };

  ns.LocalStorageController.prototype.formatDate_ = function (date, format) {
    date = new Date(date);
    var formattedDate = pskl.utils.Template.replace(format, {
      Y : date.getFullYear(),
      M : pad(date.getMonth() + 1),
      D : pad(date.getDate()),
      H : pad(date.getHours()),
      m : pad(date.getMinutes())
    });

    return formattedDate;
  };

  ns.LocalStorageController.prototype.fillLocalPiskelsList_ = function () {
    var html = "";
    var keys = this.service_.getKeys();

    keys.sort(function (k1, k2) {
      if (k1.date < k2.date) {return 1;}
      if (k1.date > k2.date) {return -1;}
      return 0;
    });

    keys.forEach((function (key) {
      var date = this.formatDate_(key.date, "{{Y}}/{{M}}/{{D}} {{H}}:{{m}}");
      html += pskl.utils.Template.replace(this.localStorageItemTemplate_, {name : key.name, date : date});
    }).bind(this));

    var tableBody_ = this.piskelsList.get(0).tBodies[0];
    tableBody_.innerHTML = html;
  };

})();