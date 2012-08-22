(function ($) {
  var frames = [], isClicked = false, brushSize = 10, index = -1, animIndex = 0, button = 0;


  var piskel = {
    init : function () {
      this.addFrame();

      setInterval(this.refreshAnimatedPreview, 500);
    },

    getCurrentCanvas : function () {
      return frames[index];
    },

    onCanvasMousemove : function (event) {
      //this.updateCursorInfo(event);
      if (isClicked) {
        var coords = this.getRelativeCoordinates(event.clientX, event.clientY);
        this.drawAt(coords.x, coords.y);
      }
    },

    createPreviews : function () {
      var container = $('preview-list');
      container.innerHTML = "";
      for (var i = 0 ; i < frames.length ; i++) {
        var preview = document.createElement("li");
        if (index == i) {
          preview.className = "selected";
        }
        var canvasPreview = document.createElement("canvas");
        
        canvasPreview.setAttribute('width', '128');
        canvasPreview.setAttribute('height', '128');
        
        canvasPreview.setAttribute('onclick', 'piskel.setFrame('+i+')');

        canvasPreview.getContext('2d').drawImage(frames[i], 0, 0, 320, 320, 0, 0 , 128, 128);
        preview.appendChild(canvasPreview);


        container.appendChild(preview);

      }
    },

    refreshAnimatedPreview : function () {
      var context = $('animated-preview').getContext('2d');
      // erase canvas, verify proper way
      context.fillStyle = "white";
      context.fillRect(0, 0, 256, 256);

      context.drawImage(frames[animIndex++], 0, 0, 320, 320, 0, 0 , 256, 256);
      if (animIndex == frames.length) {
        animIndex = 0;
      }
    },

    setFrame : function (frameIndex) {
      index = frameIndex;
      $('canvas-container').innerHTML = "";
      $('canvas-container').appendChild(this.getCurrentCanvas());
      this.createPreviews();
    },

    updateCursorInfo : function (event) {
      var cursor = $('cursorInfo');
      cursor.style.top = event.clientY + 10 + "px";
      cursor.style.left = event.clientX + 10 + "px";

      var coordinates = this.getRelativeCoordinates(event.clientX, event.clientY)
      cursor.innerHTML = [
        "X : " + coordinates.x,
        "Y : " + coordinates.y
      ].join(", ");
    },

    onCanvasMousedown : function (event) {
      isClicked = true;
      button = event.button;
      var coords = this.getRelativeCoordinates(event.clientX, event.clientY);
      this.drawAt(coords.x, coords.y);
    },
    
    onCanvasMouseup : function (event) {
      isClicked = false;
    },

    drawAt : function (x, y) {
      if (x < 0 || y < 0 || x > 320 || y > 320) return;
      var context = this.getCurrentCanvas().getContext('2d');
      if (button == 0) {
        context.fillStyle = "black";      
      } else {
        context.fillStyle = "white";      
      }

      context.fillRect(x - x%brushSize, y - y%brushSize, brushSize, brushSize);
      this.createPreviews();
    },

    onCanvasContextMenu : function (event) {
      event.preventDefault();
      event.stopPropagation();
      event.cancelBubble = true;
      return false;
    },
    getRelativeCoordinates : function (x, y) {
      var canvas = this.getCurrentCanvas();
      var canvasRect = canvas.getBoundingClientRect();
      return {
        x : x - canvasRect.left,
        y : y - canvasRect.top
      }
    },

    addFrame : function () {
      var canvas = document.createElement("canvas");
      canvas.setAttribute('width', '320');
      canvas.setAttribute('height', '320');
      canvas.setAttribute('onmousemove', 'piskel.onCanvasMousemove(arguments[0])');
      canvas.setAttribute('oncontextmenu', 'piskel.onCanvasContextMenu(arguments[0])');
      canvas.setAttribute('onclick', 'piskel.onCanvasClick(arguments[0])');
      var context = canvas.getContext('2d'); 

      context.fillStyle = "white";
      context.fillRect(0, 0, 320, 320);

      if(frames[index]) { //is a valid canvas
        context.drawImage(frames[index], 0, 0, 320, 320, 0, 0 , 320, 320);
      }

      frames.push(canvas);
      this.setFrame(frames.length - 1);
    }
  };

  window.piskel = piskel;
  piskel.init();

})(function(id){return document.getElementById(id)});