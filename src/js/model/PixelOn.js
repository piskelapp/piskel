(function () {
  var ns = $.namespace('pskl.model');

  /**
   * PixelOn 애드온의 전체 상태를 관리하는 최상위 모델.
   */
  ns.PixelOn = function (width, height, generateCount) {
    if (width && height && generateCount != null) {
      // --- 기본 설정 ---
      this.width = width;
      this.height = height;
      this.generateCount = generateCount;
      this.imageStore = new Map();
      this.sessions = [];           
    } else {
      throw 'Missing arguments in PixelOn constructor : ' + Array.prototype.join.call(arguments, ',');
    }
  };

  /**
   * 기본적인 getter/setter method
   */
  ns.PixelOn.prototype.getWidth = function () {
    return this.width;
  };
  ns.PixelOn.prototype.getHeight = function () {
    return this.height;
  };
  ns.PixelOn.prototype.getGenerateCount = function () {
    return this.generateCount;
  };
  ns.PixelOn.prototype.setWidth = function (width) {
    this.width = width;
  };
  ns.PixelOn.prototype.setHeight = function (height) {
    this.height = height;
  };
  ns.PixelOn.prototype.setGenerateCount = function (count) {
    this.generateCount = count;
  };
  // 이미지 저장소에 이미지 추가/조회 메서드
  ns.PixelOn.prototype.addImage = function (uuid, data) {
    // uuid 모듈을 사용하여 고유한 식별자 생성 후 imageStore에 저장
    this.imageStore.set(uuid, data);
  };
  ns.PixelOn.prototype.getImage = function (uuid) {
    return this.imageStore.get(uuid);
  };
  ns.PixelOn.prototype.addSession = function (session) {
    this.sessions.push(session)
  };
  ns.PixelOn.prototype.getSessions = function() {
    return this.sessions;
  };
  ns.PixelOn.prototype.getSessionAt = function(index) {
    return this.sessions[index];
  };
  ns.PixelOn.prototype.removeSession = function (session) {
    var index = this.sessions.indexOf(session);
    if (index != -1) {
      this.sessions.splice(index, 1);
    }
  };
  ns.PixelOn.prototype.removeSessionAt = function(index) {
    this.sessions.splice(index, 1);
  };
})();