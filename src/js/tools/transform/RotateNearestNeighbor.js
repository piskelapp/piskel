(function () {
  var ns = $.namespace('pskl.tools.transform');

  ns.RotateNearestNeighbor = function () {
    this.toolId = 'tool-rotate-nearest-neighbor';
    this.helpText = 'Rotate selection using nearest neighbor interpolation';
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

  ns.RotateNearestNeighbor.prototype.applyToolOnFrame_ = function (frame, altKey) {
	if (altKey) {
      var angleInput = prompt("Enter rotation angle in degrees [-360, 360]");
	  var angle = parseFloat(angleInput);
	  this.setAngle(angle); // Update the angle
    } else {
	  ns.TransformUtils.rotateNearestNeighbor(frame, this.angle);
    }
	
  };

})();
