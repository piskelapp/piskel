describe("Job for // async", function() {

  beforeEach(function() {});
  afterEach(function() {});

  it("completes synchronous job", function() {
    // when
    var isComplete = false;
    var result = null;
    // then
    var job = new pskl.utils.Job({
      items : [0,1,2,3,4],
      args : {
        store : []
      },
      process : function (item, callback) {
        callback(item+5)
      },
      onProcessEnd : function (value, index) {
        this.args.store[index] = value;
      },
      onComplete : function (args) {
        isComplete = true;
        result = args.store;
      }
    });

    job.start();

    // verify
    expect(isComplete).toBe(true);
    expect(result).toEqual([5,6,7,8,9]);
  });

  describe("async", function () {
    // when
    var isComplete = false;
    var result = null;

    beforeEach(function(done) {
      // then
      var job = new pskl.utils.Job({
        items : [0,1,2,3,4],
        args : {
          store : []
        },
        process : function (item, callback) {
          setTimeout(function (item, callback) {
            callback(item+5);
          }.bind(this, item, callback), 100 - (item * 20));
        },
        onProcessEnd : function (value, index) {
          console.log('Processed ', index);
          this.args.store[index] = value;
        },
        onComplete : function (args) {
          isComplete = true;
          result = args.store;
          done();
        }
      });

      job.start();
    });
    it("completes asynchronous job", function() {
      // verify
      expect(isComplete).toBe(true);
      expect(result).toEqual([5,6,7,8,9]);
    });

  })

});