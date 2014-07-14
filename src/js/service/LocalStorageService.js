(function () {
  var ns = $.namespace("pskl.service");

  ns.LocalStorageService = function (piskelController) {

    if(piskelController === undefined) {
      throw "Bad LocalStorageService initialization: <undefined piskelController>";
    }
    this.piskelController = piskelController;
  };

  ns.LocalStorageService.prototype.init = function() {};

  ns.LocalStorageService.prototype.save = function(name, description, piskel) {
    this.removeFromKeys_(name);
    this.addToKeys_(name, description, Date.now());
    window.localStorage.setItem('piskel.' + name, piskel);
  };

  ns.LocalStorageService.prototype.load = function(name) {
    var piskelString = this.getPiskel(name);
    var key = this.getKey_(name);
    var serializedPiskel = JSON.parse(piskelString);
    // FIXME : should be moved to deserializer
    // Deserializer should call callback with descriptor + fps information
    var fps = serializedPiskel.piskel.fps;
    var description = serializedPiskel.piskel.description;

    pskl.utils.serialization.Deserializer.deserialize(serializedPiskel, function (piskel) {
      piskel.setDescriptor(new pskl.model.piskel.Descriptor(name, description, true));
      pskl.app.piskelController.setPiskel(piskel);
      pskl.app.animationController.setFPS(fps);
    });
  };

  ns.LocalStorageService.prototype.remove = function(name) {
    this.removeFromKeys_(name);
    window.localStorage.removeItem('piskel.' + name);
  };

  ns.LocalStorageService.prototype.saveKeys_ = function(keys) {
    window.localStorage.setItem('piskel.keys', JSON.stringify(keys));
  };

  ns.LocalStorageService.prototype.removeFromKeys_ = function(name) {
    var keys = this.getKeys();
    var otherKeys = keys.filter(function (key) {
      return key.name !== name;
    });

    this.saveKeys_(otherKeys);
  };

  ns.LocalStorageService.prototype.getKey_ = function(name) {
    var matches = this.getKeys().filter(function (key) {
      return key.name === name;
    });
    if (matches.length > 0) {
      return matches[0];
    } else {
      return null;
    }
  };

  ns.LocalStorageService.prototype.addToKeys_ = function(name, description, date) {
    var keys = this.getKeys();
    keys.push({
      name : name,
      description : description,
      date : date
    });
    this.saveKeys_(keys);
  };

  ns.LocalStorageService.prototype.getPiskel = function(name) {
    return window.localStorage.getItem('piskel.' + name);
  };

  ns.LocalStorageService.prototype.getKeys = function(name) {
    var keysString = window.localStorage.getItem('piskel.keys');
    return JSON.parse(keysString) || [];
  };

})();