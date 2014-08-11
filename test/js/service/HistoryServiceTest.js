describe("History Service suite", function() {
  it("starts at -1", function() {
    var mockPiskelController = {};
    var mockShortcutService = {};
    var historyService = new pskl.service.HistoryService(mockPiskelController, mockShortcutService);
    expect(historyService.currentIndex).toBe(-1);
  });

  it("is at 0 after init", function() {
    var mockPiskelController = {
      serialize : function () {
        return 'serialized-piskel';
      }
    };
    var mockShortcutService = {
      addShortcut : function () {}
    };
    var historyService = new pskl.service.HistoryService(mockPiskelController, mockShortcutService);
    historyService.init();
    expect(historyService.currentIndex).toBe(0);
  });
});