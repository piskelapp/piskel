(function () {
  var ns = $.namespace('pskl.model.pixelOn');

  /**
   * 하나의 AI 생성 세션.
   * @param {String} name  - 이 세션을 시작한 최초의 대표 프롬프트
   * @param {Object} spec           - 생성 명세
   */
  ns.AiSession = function (name, spec) {
    this.uuid = pskl.utils.Uuid.generate();
    this.createdAt = Date.now();

    this.name = name===""? 'Untitled Session' : name;
    this.spec = spec;
    this.imageUuidsList = [];
  };
  ns.AiSession.prototype.getUuid = function () {
    return this.uuid;
  };
  ns.AiSession.prototype.getCreatedAt = function () {
    return this.createdAt;
  }; 
  ns.AiSession.prototype.getName = function () {
    return this.name;
  };
  ns.AiSession.prototype.getPPrompt = function() {
    return this.spec.p_prompt;
  };
  ns.AiSession.prototype.getNPrompt = function() {
    return this.spec.n_prompt;
  };
  ns.AiSession.prototype.getSeed = function() {
    return this.spec.seed;
  };
  ns.AiSession.prototype.getWidth = function() {
    return this.spec.width;
  };
  ns.AiSession.prototype.getHeight = function() {
    return this.spec.height;
  };
  ns.AiSession.prototype.getGenerateCount = function() {
    return this.spec.generateCount;
  };
  ns.AiSession.prototype.getSpec = function() {
    return this.spec;
  };
  ns.AiSession.prototype.getImageUuidsList = function() {
    return this.imageUuidsList;
  }
  ns.AiSession.prototype.addImageUuid = function(uuid) {
    this.imageUuidsList.push(uuid);
  };
  ns.AiSession.prototype.removeImageUuid = function(uuid) {
    const index = this.imageUuidsList.findIndex((_uuid) => _uuid == uuid);
    if (index !== -1) {
      this.imageUuidsList.splice(index, 1)
    } 
  };

  ns.AiSession.prototype.setName = function (name) {
    this.name = name;
  };
  ns.AiSession.prototype.setSpec = function (spec) {
    this.spec = spec;
  };

})();