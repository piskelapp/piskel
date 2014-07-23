describe("History Service suite", function() {
  it("contains spec with an expectation", function() {

    var mockPiskelController = {};
    var historyService = new pskl.service.HistoryService(mockPiskelController);
    expect(historyService.currentIndex).toBe(0);
  });
});