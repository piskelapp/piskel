(function () {
  var ns = $.namespace("pskl.controller.settings");

  ns.LocalStorageController = function () {};

  /**
   * @public
   */
  ns.LocalStorageController.prototype.init = function() {
    this.localStorageItemTemplate_ = pskl.utils.Template.get("local-storage-item-template");
    this.service_ = pskl.app.localStorageService;
    this.piskelsList = $('.local-piskels-list');

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
        $.publish(Events.CLOSE_SETTINGS_DRAWER);
      }
    }
  };

  ns.LocalStorageController.prototype.fillLocalPiskelsList_ = function () {
    var html = "";
    var keys = this.service_.getKeys();

    var pad = function (num) {
      if (num < 10) {
        return "0" + num;
      } else {
        return "" + num;
      }
    };


    keys.sort(function (k1, k2) {
      if (k1.date < k2.date) {return 1;}
      if (k1.date > k2.date) {return -1;}
      return 0;
    });

    keys.forEach((function (key) {
      var date = new Date(key.date);
      var formattedDate = pskl.utils.Template.replace("{{Y}}/{{M}}/{{D}} {{H}}:{{m}}", {
        Y : date.getFullYear(),
        M : pad(date.getMonth() + 1),
        D : pad(date.getDate()),
        H : pad(date.getHours()),
        m : pad(date.getMinutes())
      });
      html += pskl.utils.Template.replace(this.localStorageItemTemplate_, {name : key.name, date : formattedDate});
    }).bind(this));

    var tableBody_ = this.piskelsList.get(0).tBodies[0];
    tableBody_.innerHTML = html;
  };

})();