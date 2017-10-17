(function () {
  var ns = $.namespace('pskl.database');

  var DB_NAME = 'PiskelDatabase';
  var DB_VERSION = 1;

  // Simple wrapper to promisify a request.
  var _requestPromise = function (req) {
    var deferred = Q.defer();
    req.onsuccess = deferred.resolve.bind(deferred);
    req.onerror = deferred.reject.bind(deferred);
    return deferred.promise;
  };

  /**
   * The PiskelDatabase handles all the database interactions related
   * to the local piskel saved that can be performed in-browser.
   */
  ns.PiskelDatabase = function (options) {
    this.db = null;
  };

  ns.PiskelDatabase.DB_NAME = DB_NAME;

  ns.PiskelDatabase.prototype.init = function () {
    var request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = this.onUpgradeNeeded_.bind(this);

    return _requestPromise(request).then(function (event) {
      this.db = event.target.result;
      return this.db;
    }.bind(this));
  };

  ns.PiskelDatabase.prototype.onUpgradeNeeded_ = function (event) {
    // Set this.db early to allow migration scripts to access it in oncomplete.
    this.db = event.target.result;

    // Create an object store "piskels" with the autoIncrement flag set as true.
    var objectStore = this.db.createObjectStore('piskels', { keyPath : 'name' });
    objectStore.transaction.oncomplete = function(event) {
      pskl.database.migrate.MigrateLocalStorageToIndexedDb.migrate(this);
    }.bind(this);
  };

  ns.PiskelDatabase.prototype.openObjectStore_ = function () {
    return this.db.transaction(['piskels'], 'readwrite').objectStore('piskels');
  };

  /**
   * Send a get request for the provided name.
   * Returns a promise that resolves the request event.
   */
  ns.PiskelDatabase.prototype.get = function (name) {
    var objectStore = this.openObjectStore_();
    return _requestPromise(objectStore.get(name)).then(function (event) {
      return event.target.result;
    });
  };

  /**
   * List all locally saved piskels.
   * Returns a promise that resolves an array of objects:
   * - name: name of the piskel
   * - description: description of the piskel
   * - date: save date
   *
   * The sprite content is not contained in the object and
   * needs to be retrieved with a separate get.
   */
  ns.PiskelDatabase.prototype.list = function () {
    var deferred = Q.defer();

    var piskels = [];
    var objectStore = this.openObjectStore_();
    var cursor = objectStore.openCursor();
    cursor.onsuccess = function(event) {
      var cursor = event.target.result;
      if (cursor) {
        piskels.push({
          name: cursor.value.name,
          date: cursor.value.date,
          description: cursor.value.description
        });
        cursor.continue();
      } else {
        // Cursor consumed all availabled piskels
        deferred.resolve(piskels);
      }
    };

    cursor.onerror = function () {
      deferred.reject();
    };

    return deferred.promise;
  };

  /**
   * Send an put request for the provided args.
   * Returns a promise that resolves the request event.
   */
  ns.PiskelDatabase.prototype.update = function (name, description, date, serialized) {
    var data = {};

    data.name = name;
    data.serialized = serialized;
    data.date = date;
    data.description = description;

    var objectStore = this.openObjectStore_();
    return _requestPromise(objectStore.put(data));
  };

  /**
   * Send an add request for the provided args.
   * Returns a promise that resolves the request event.
   */
  ns.PiskelDatabase.prototype.create = function (name, description, date, serialized) {
    var data = {};

    data.name = name;
    data.serialized = serialized;
    data.date = date;
    data.description = description;

    var objectStore = this.openObjectStore_();
    return _requestPromise(objectStore.add(data));
  };

  /**
   * Delete a saved piskel for the provided name.
   * Returns a promise that resolves the request event.
   */
  ns.PiskelDatabase.prototype.delete = function (name) {
    var objectStore = this.openObjectStore_();
    return _requestPromise(objectStore.delete(name));
  };
})();
