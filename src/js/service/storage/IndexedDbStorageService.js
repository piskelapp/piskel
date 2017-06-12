(function () {
  var ns = $.namespace('pskl.service.storage');
  var DB_NAME = 'PiskelDatabase';
  var DB_VERSION = 1;

  ns.IndexedDbStorageService = function (piskelController) {
    this.piskelController = piskelController;
    this.piskelDatabase = new pskl.database.PiskelDatabase();
  };

  ns.IndexedDbStorageService.prototype.init = function () {
    this.piskelDatabase.init();
  };

  ns.IndexedDbStorageService.prototype.save = function (piskel) {
    var name = piskel.getDescriptor().name;
    var description = piskel.getDescriptor().description;
    var date = Date.now();
    var serialized = pskl.utils.serialization.Serializer.serialize(piskel);

    return this.save_(name, description, date, serialized);
  };

  ns.IndexedDbStorageService.prototype.save_ = function (name, description, date, serialized) {
    return this.piskelDatabase.get(name).then(function (event) {
      var data = event.target.result;
      if (typeof data !== 'undefined') {
        return this.piskelDatabase.update(name, description, date, serialized);
      } else {
        return this.piskelDatabase.create(name, description, date, serialized);
      }
    }.bind(this));
  };

  ns.IndexedDbStorageService.prototype.load = function (name) {
    this.piskelDatabase.get(name).then(function (event) {
      var data = event.target.result;
      if (typeof data !== 'undefined') {
        var serialized = data.serialized;
        pskl.utils.serialization.Deserializer.deserialize(
          JSON.parse(serialized),
          function (piskel) {
            pskl.app.piskelController.setPiskel(piskel);
          }
        );
      } else {
        console.log('no local browser save found for name: ' + name);
      }
    });
  };

  ns.IndexedDbStorageService.prototype.remove = function (name) {
    this.piskelDatabase.delete(name);
  };

  ns.IndexedDbStorageService.prototype.getKeys = function () {
    return this.piskelDatabase.list();
  };
})();
