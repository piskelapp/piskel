(function () {
  var ns = $.namespace('pskl.controller.pixelOn');

  /**
   * Main controller for the PixelOn addon, managing its data model.
   */
  ns.PixelOnController = function (pixelOn) {
    if (pixelOn) {
      this.setPixelOn(pixelOn);
    } else {
      throw 'A piskel instance is mandatory for instanciating PiskelController';
    }

    this.sample_data = [
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABoElEQVR4AeyV4XIDIQiE2T55++TXXaKJXkG8dm76J46oKCyfJpN82D+3N0D2Agc/GRmne3sGYMfh9TXIbqNIAVSxQfhSwx22BFDBAULuXyx8yRJAFRtEKKDzDUtzUwAAZl9p3kbNZwj5c50MgNWbQIOgijZyJZ3+NKYdBrzkziEZgOKAz9WxVc2LD68YUuxVaK9QVRzOn8XxuERY3NgqgNcrEIKqTLGDQ2UMMcOjuK1aBaDcF4Q8mkAi45F3nQF+aQ0y34+GHQDPQ7uNxC1p/QxY1pyytwG6+JQdOIqTBUfh1jZAmL3YbBD9u5JG7gBQSzqpRnrAxPFPLYzbAZgSAYQ/LEC8PyUHTgXAS/zu9mMtisgNhSoAJU4mMdm0SUd7Mi4v9csAl9Q3gt8AqxfgRzp/bwBMjwqs/R4MeJwPfa/PK4AeszUDoX6ZexkAgP8OAHBxAO7L4ZNpmgzA5J+dFQDYpngVWNkUTGfITylWAJSw5+2saCp2NqaosIzLuFcASqYuHISLdKY8AuPWulcAPTsSP+/12EvzLsAl0TG4Wn8DAAD//1SS+kMAAAAGSURBVAMAarinQckpiIkAAAAASUVORK5CYII=",
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABr0lEQVR4AeyUwU0DMRBFHTqgBY40gEQDHKiAGxfuXDhx5kJogFKQaIBqEhpg8RuNN8Os7bW1K4FQov3rmdk/f76dTU7CL3+OBv70CQzx9bCI6fpX6QQYHLZXpwIdKzWNV1tKBuzgH/Fqk1WoaECf+6XnFOB6eL1QNXB9czc28HVo4kVtrpRATU6OPqAPpK6xLFUDMKwJcoCgB/UIBgAZHvPxgj8mJigZ2Dy87YR2ef8qKzdEALEHdUA9rcRsABDnUDIg3PPb5/B4UaUIz97s8KePr5A2kDZkucQ19Q2EJcD8fv8Z2EjUQQ/E8HDVDBxYCyJ7IjmZmoHBNnOEwItQA77empcMyJvcKrKElzMgw+3uGUAOiC2oAVvrib2B7PAewV6uNzD5A+kV9Py592NiwAuslE9+fkm3y8DcbpJoWpVfHA6vakAF4AUbS2Hm1sqfGPCN5GDY7gIgtsj54Hmss3MQw/LlDUiDCsgLyU8MvLyfBUBsYaXpA7Y2F3sD8EcTiAGKnRCNlp6cAfoQGIGJFtAYQV9c2q6SAd+NaCt8bzVvNVAVWfLwaOD/n8Dc+/ENAAD//zmWiXwAAAAGSURBVAMAUL+fQURvOjIAAAAASUVORK5CYII=",
    ];
  };

  /**
   * Set a new PixelOn model.
   * @param {Object} pixelOn
   */
  ns.PixelOnController.prototype.setPixelOn = function(pixelOn) {
    this.pixelOn = pixelOn;
  };

  ns.PixelOnController.prototype.init = function () {
  };

  // =================================================================
  //                             API
  // =================================================================
  ns.PixelOnController.prototype.generateAndAddToFrame = function(spec, piskelController) {
      var newSession = new pskl.model.pixelOn.AiSession(spec.p_prompt, spec);
      this.addSession(newSession);

      var sampleImage = this.sample_data[Math.floor(Math.random() * this.sample_data.length)];
      var imageUuid = this.addImage(sampleImage, spec);
      newSession.addImageUuid(imageUuid);

      pskl.utils.FrameUtils.createFromImageSrc(sampleImage, false, function(frame) {
          piskelController.addFrameAtCurrentIndex();
          var targetFrame = piskelController.getCurrentFrame();
          targetFrame.setPixels(frame.pixels);
          $.publish(Events.PISKEL_SAVE_STATE, {
              type: pskl.service.HistoryService.SNAPSHOT
          });
      });
  };

  // =================================================================
  //                             GETTERS
  // =================================================================
  ns.PixelOnController.prototype.getPixelOn = function() {
    return this.pixelOn;
  }
  ns.PixelOnController.prototype.getWidth = function () {
    return this.pixelOn.getWidth();
  };
  ns.PixelOnController.prototype.getHeight = function () {
    return this.pixelOn.getHeight();
  };
  ns.PixelOnController.prototype.getGenerateCount = function () {
    return this.pixelOn.getGenerateCount();
  };
  ns.PixelOnController.prototype.getImage = function (uuid) {
    return this.pixelOn.getImage(uuid);
  };
  ns.PixelOnController.prototype.getSessions = function () {
    return this.pixelOn.getSessions();
  }
  ns.PixelOnController.prototype.getSessionAt = function(index) {
    var sessions = this.getSessions();
    return (index >= 0 && index < sessions.length) ? sessions[index] : null;
  }
  ns.PixelOnController.prototype.getSessionByUuid = function(uuid) {
    return this.getSessions().find(session => session.getUuid() == uuid);
  }

  // =================================================================
  //                             SETTERS / MODIFIERS
  // =================================================================
  ns.PixelOnController.prototype.setWidth = function(width) {
    this.pixelOn.setWidth(width);
  };
  ns.PixelOnController.prototype.setHeight = function(height) {
    this.pixelOn.setHeight(height);
  };
  ns.PixelOnController.prototype.setGenerateCount = function(count) {
    this.pixelOn.setGenerateCount(count);
  };
  ns.PixelOnController.prototype.addImage = function(image, spec) {
    const uuid = pskl.utils.Uuid.generate();
    this.pixelOn.addImage(uuid, { image, spec });
    return uuid;
  };
  ns.PixelOnController.prototype.addSession = function(session) {
    this.pixelOn.addSession(session);
  };
  ns.PixelOnController.prototype.removeSession = function(session) {
    this.pixelOn.removeSession(session);
  };
  ns.PixelOnController.prototype.removeSessionAt = function(index) {
    this.pixelOn.removeSessionAt(index);
  };
  ns.PixelOnController.prototype.removeSessionByUuid = function(uuid) {
    var session = this.getSessionByUuid(uuid);
    if (session) {
      this.removeSession(session);
    }
  };
  ns.PixelOnController.prototype.renameSession = function(uuid, name) {
    const session = this.getSessionByUuid(uuid);
    if (session) {
      session.setName(name);
    }
  };
})();
