(function ($) {
  var frames = [], isClicked = false, brushSize = 10, index = -1, animIndex = 0, button = 0;


  var piskel = {
    init : function () {
      this.addFrame();
      this.initPreview();
    },

    initPreview : function() {
      var scope = this;

      var animFPSTuner = document.getElementById("preview-fps");
      var animPreviewFPS = parseInt(animFPSTuner.value, 10);
      var startPreviewRefresh = function() {
        return setInterval(scope.refreshAnimatedPreview, 1000/animPreviewFPS);
      };
      var refreshUpdater = startPreviewRefresh();
      
      animFPSTuner.addEventListener('keyup', function(evt) {
        window.clearInterval(refreshUpdater);
        animPreviewFPS = parseInt(animFPSTuner.value, 10);
        if(isNaN(animPreviewFPS)) {
          animPreviewFPS = 1;
        }
        if(evt.keyCode == 38) {
          animPreviewFPS++;
        }
        else if (evt.keyCode == 40) {
          animPreviewFPS--;
        }
        if(animPreviewFPS < 1) {
          animPreviewFPS = 1;
        }
        if(animPreviewFPS > 100) {
          animPreviewFPS = 100;
        }
        animFPSTuner.value = animPreviewFPS;
        refreshUpdater = startPreviewRefresh();
      });
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
      var container = $('preview-list'), previewTile;
      container.innerHTML = "";
      for (var i = 0 ; i < frames.length ; i++) {
        previewTile = this.createPreviewTile(i);
        container.appendChild(previewTile);
      }
    },

    createPreviewTile: function(tileNumber) {
      var preview = document.createElement("li");
      var classname = "preview-tile";

      if (index == tileNumber) {
        classname += " selected";
      }
      preview.className = classname;

      var canvasPreview = document.createElement("canvas");
      canvasPreview.className = "tile-view"
      
      canvasPreview.setAttribute('width', '128');
      canvasPreview.setAttribute('height', '128');     
      canvasPreview.setAttribute('onclick', 'piskel.setFrame('+ tileNumber +')');

      var canvasPreviewDuplicateAction = document.createElement("button");
      canvasPreviewDuplicateAction.className = "tile-action"
      canvasPreviewDuplicateAction.innerHTML = "dup"
      canvasPreviewDuplicateAction.setAttribute('onclick', 'piskel.duplicateFrame('+ tileNumber +')');
        
      canvasPreview.getContext('2d').drawImage(frames[tileNumber], 0, 0, 320, 320, 0, 0 , 128, 128);
      preview.appendChild(canvasPreview);
      preview.appendChild(canvasPreviewDuplicateAction);
      
      if(frames.length > 1) {
        var canvasPreviewDeleteAction = document.createElement("button");
        canvasPreviewDeleteAction.className = "tile-action"
        canvasPreviewDeleteAction.innerHTML = "del"
        canvasPreviewDeleteAction.setAttribute('onclick', 'piskel.removeFrame('+ tileNumber +')');
        preview.appendChild(canvasPreviewDeleteAction);
      }

      return preview;
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

    removeFrame: function(frameIndex) {
      index = frameIndex - 1 < 0 ? 0 : frameIndex - 1;
      animIndex = 0;
      frames.splice(frameIndex, 1);
      $('canvas-container').innerHTML = "";
      $('canvas-container').appendChild(this.getCurrentCanvas());
      this.createPreviews();
    },

    duplicateFrame: function(frameIndex) {
      index = frameIndex + 1;
      animIndex = 0;
      var duplicateCanvas = frames[frameIndex].cloneNode(true);
      // Copy canvas content:
      var context = duplicateCanvas.getContext('2d');
      context.drawImage(frames[frameIndex], 0, 0);

      // Insert cloned node into frame collection:
      frames.splice(frameIndex + 1, 0, duplicateCanvas);
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
      //canvas.setAttribute('onclick', 'piskel.onCanvasClick(arguments[0])');
      var context = canvas.getContext('2d'); 

      context.fillStyle = "white";
      context.fillRect(0, 0, 320, 320);

      if(frames[index]) { //is a valid canvas
        context.drawImage(frames[index], 0, 0, 320, 320, 0, 0 , 320, 320);
      }

      // TODO: We should probably store some metadata or enhance a domain object instead
      //       of the rendered view ? It will allow to decouple view and model and clean a bunch of code above.
      frames.push(canvas);
      this.setFrame(frames.length - 1);
    }
  };

  window.piskel = piskel;
  piskel.init();

})(function(id){return document.getElementById(id)});