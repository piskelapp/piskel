(function () {
  var ns = $.namespace('pskl.tools.transform');

  ns.RotateNearestNeighbor = function () {
    this.toolId = 'tool-rotate-nearest-neighbor';
    this.helpText = '(New!) Rotate to any angle using nearest neighbor interpolation';
    this.angle = 90; // Default rotation step in degrees
    this.tooltipDescriptors = [
      {key : 'alt', description : 'Set Angle'},
      {key : 'ctrl', description : 'Apply to all layers'},
      {key : 'shift', description : 'Apply to all frames'}];
  };


  pskl.utils.inherit(ns.RotateNearestNeighbor, ns.AbstractTransformTool);


  // Method to change the value of the re-assignable variable
  ns.RotateNearestNeighbor.prototype.setAngle = function (newAngle) {
    this.angle = newAngle;
  };


  // overload applyTransformation so undo/redo and setting angle work properly
  ns.RotateNearestNeighbor.prototype.applyTransformation = function (evt) {
    var allFrames = evt.shiftKey;
    var allLayers = pskl.utils.UserAgent.isMac ?  evt.metaKey : evt.ctrlKey;

	// if altKey then set set angle
	if (evt.altKey) {
      var angleInput = prompt("Enter rotation angle in degrees [-360, 360]");
	  var angle = parseFloat(angleInput);
	  this.setAngle(angle); // Update the angle
    }

    this.applyTool_(evt.altKey, allFrames, allLayers); // apply tool as usual

    $.publish(Events.PISKEL_RESET);

    this.raiseSaveStateEvent({
      altKey : evt.altKey, // not needed?
      allFrames : allFrames,
      allLayers : allLayers,
	  angle : this.angle, // Include the angle in the saved state
    });
  };

  
  ns.RotateNearestNeighbor.prototype.applyToolOnFrame_ = function (frame, altKey) {
	// we don't want a dialog when we undo/redo so altKey isn't used
	// perform rotation
	ns.TransformUtils.rotateNearestNeighbor(frame, this.angle);
  };
  
  
  // overload replay for undo/redo to work properly
  ns.RotateNearestNeighbor.prototype.replay = function (frame, replayData) {
    ns.TransformUtils.rotateNearestNeighbor(frame, replayData.angle);
  };

})();
