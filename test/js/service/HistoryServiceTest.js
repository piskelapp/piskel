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
    return historyService.getCurrentState();
  };

  var createMockHistoryService = function () {
    var mockPiskelController = {
      serialize : function () {
        return SERIALIZED_PISKEL;
      }
    };
    var mockShortcutService = {
      registerShortcuts : function () {},
      registerShortcut : function () {}
    };
    return new pskl.service.HistoryService(mockPiskelController, mockShortcutService);
  };

  it("starts empty", function() {
    historyService = createMockHistoryService();
    expect(historyService.stateQueue.length).toBe(0);
  });

  it("has 1 item after init", function() {
    historyService = createMockHistoryService();
    historyService.init();
    expect(historyService.stateQueue.length).toBe(1);
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

    expect(historyService.stateQueue.length).toBe(5);

    expect(getLastState().piskel).toBe(SERIALIZED_PISKEL);

    sendSaveEvents(pskl.service.HistoryService.REPLAY).times(4);
    expect(getLastState().piskel).toBeUndefined();

    sendSaveEvents(pskl.service.HistoryService.REPLAY).once();
    expect(getLastState().piskel).toBe(SERIALIZED_PISKEL);

    // AFTER
    pskl.service.HistoryService.SNAPSHOT_PERIOD = SNAPSHOT_PERIOD_BACKUP;

  });
});