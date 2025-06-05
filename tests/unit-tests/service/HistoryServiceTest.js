var callFactory = function (method) {
  return {
    times : function (times) {
      var results = [];
      for (var i = 0 ; i < times ; i++) {
        results.push(method());
      }
      return results;
    },
    once : function () {
      return method();
    }
  };
};

describe("History Service suite", function() {
  var SERIALIZED_PISKEL = 'serialized-piskel';
  var historyService = null;

  var getLastState = function () {
    return historyService.stateQueue[historyService.currentIndex];
  };

  var createMockHistoryService = function () {
    var mockPiskelController = {
      getWrappedPiskelController: function () {
        return {
          getPiskel : function () {},
          getFPS : function () {
            return 12;
          }
        }
      }
    };
    var mockShortcutService = {
      registerShortcuts : function () {},
      registerShortcut : function () {}
    };
    return new pskl.service.HistoryService(mockPiskelController, mockShortcutService,
      { deserialize : function () {}},
      { serialize : function () { return SERIALIZED_PISKEL }}
    );
  };

  it("starts at -1", function() {
    historyService = createMockHistoryService();
    expect(historyService.currentIndex).toBe(-1);
  });

  it("is at 0 after init", function() {
    historyService = createMockHistoryService();
    historyService.init();
    expect(historyService.currentIndex).toBe(0);
  });

  var sendSaveEvents = function (type) {
    return callFactory (function () {
      $.publish(Events.PISKEL_SAVE_STATE, {
        type : type,
        scope : {},
        replay : {}
      });
    });
  };

  it("stores a piskel snapshot after 5 SAVE", function () {
    // BEFORE
    var SNAPSHOT_PERIOD_BACKUP = pskl.service.HistoryService.SNAPSHOT_PERIOD;
    pskl.service.HistoryService.SNAPSHOT_PERIOD = 5;

    historyService = createMockHistoryService();
    historyService.init();

    sendSaveEvents(pskl.service.HistoryService.REPLAY).times(5);

    expect(historyService.currentIndex).toBe(5);

    expect(getLastState().piskel).toBe(SERIALIZED_PISKEL);

    sendSaveEvents(pskl.service.HistoryService.REPLAY).times(4);
    expect(getLastState().piskel).toBeUndefined();

    sendSaveEvents(pskl.service.HistoryService.REPLAY).once();
    expect(getLastState().piskel).toBe(SERIALIZED_PISKEL);

    // AFTER
    pskl.service.HistoryService.SNAPSHOT_PERIOD = SNAPSHOT_PERIOD_BACKUP;

  });
});