(function ($) {
  var frameSheet,

      // Constants:
      TRANSPARENT_COLOR = 'tc',
      DEFAULT_PEN_COLOR = '#000000',
      PISKEL_SERVICE_URL = 'http://2.piskel-app.appspot.com',

      // Configuration:
      // Canvas size in pixel size (not dpi related)
      framePixelWidth = 32, 
      framePixelHeight = 32,

      // Scaling factors for a given frameSheet rendering:
      // Main drawing area:
      drawingCanvasDpi = 20,
      // Canvas previous in the slideshow:
      previewTileCanvasDpi = 4,
      // Ainmated canvas preview:
      previewAnimationCanvasDpi = 8,

      // DOM references:
      drawingAreaContainer,
      drawingAreaCanvas,
      previewCanvas,
      paletteEl,

      // States:
      isClicked = false, 
      isRightClicked = false, 
      activeFrameIndex = -1, 
      animIndex = 0,
      penColor = DEFAULT_PEN_COLOR,
      paletteColors = [],

      //utility
      _normalizeColor = function (color) {
        if(color == undefined || color == TRANSPARENT_COLOR || color.indexOf("#") == 0) {
          return color;
        } else {
          return "#" + color;
        }
      },

      // setTimeout/setInterval references:
      localStorageThrottler = null
      ;


  var piskel = {
    init : function () {
      frameSheet = FrameSheetModel.getInstance(framePixelWidth, framePixelHeight);
      this.setActiveFrame(0);
      frameSheet.addEmptyFrame();

      var frameId = this.getFrameIdFromUrl();
      if (frameId) {
        this.loadFramesheetFromService(frameId);
      } else {
        this.finishInit();
      }
    },

    finishInit : function () {
      this.initPalette();
      this.initDrawingArea();
      this.initPreviewSlideshow();
      this.initAnimationPreview();
      this.initColorPicker();
      this.initLocalStorageBackup();

      this.startAnimation();
    },

    getFrameIdFromUrl : function() {
      var href = window.location.href;
      if (href.indexOf('frameId=') != -1) {
        return href.substring(href.indexOf('frameId=')+8);
      }
    },

    loadFramesheetFromService : function (frameId) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', PISKEL_SERVICE_URL + '/get?l=' + frameId, true);
      xhr.responseType = 'text';

      xhr.onload = function(e) {
        frameSheet.deserialize(this.responseText);
        piskel.finishInit();
      };

      xhr.onerror = function () {
        piskel.finishInit();
      };

      xhr.send();
    },

    initLocalStorageBackup: function() {
      if(window.localStorage && window.localStorage['snapShot']) {
        var message = document.createElement('div');
        message.id = "user-message";
        message.className = "user-message";
        var reloadLink = "<a href='#' onclick='piskel.restoreFromLocalStorage()'>reload</a>";
        var discardLink = "<a href='#' onclick='piskel.cleanLocalStorage()'>discard</a>";
        message.innerHTML = "Non saved version found. " + reloadLink + " or " + discardLink;
        message.onclick = function() {
          message.parentNode.removeChild(message);
        };
        document.body.appendChild(message);
      }
    },

    persistToLocalStorage: function() {
      console.log('persited')
      window.localStorage['snapShot'] = frameSheet.serialize();
    },

    restoreFromLocalStorage: function() {
      frameSheet.deserialize(window.localStorage['snapShot']);
      this.setActiveFrameAndRedraw(0);
    },

    cleanLocalStorage: function() {
      delete window.localStorage['snapShot'];
    },

    setActiveFrame: function(index) {
      activeFrameIndex = index;
    },

    setActiveFrameAndRedraw: function(index) {
      this.setActiveFrame(index);
      
      // Update drawing canvas:
      this.drawFrameToCanvas(frameSheet.getFrameByIndex(this.getActiveFrameIndex()), drawingAreaCanvas, drawingCanvasDpi);
      
      // Update slideshow:
      this.createPreviews();

      // Update animation preview:
      animIndex = 0;
    },

    getActiveFrameIndex: function() {
      if(-1 == activeFrameIndex) {
        throw "Bad active frane initialization."
      }
      return activeFrameIndex;
    },

    initColorPicker: function() {
      this.colorPicker = $('color-picker');
      this.colorPicker.value = DEFAULT_PEN_COLOR;
      this.colorPicker.addEventListener('change', this.onPickerChange.bind(this));
    },

    onPickerChange : function(evt) {
        penColor = _normalizeColor(this.colorPicker.value);
    },

    initPalette : function (color) {
      paletteEl = $('palette');
    },

    addColorToPalette : function (color) {
      if (color && color != TRANSPARENT_COLOR && paletteColors.indexOf(color) == -1) {
        var colorEl = document.createElement("li");
        colorEl.setAttribute("data-color", color);
        colorEl.setAttribute("title", color);
        colorEl.style.background = color;
        paletteEl.appendChild(colorEl);
        paletteColors.push(color);
      }
    },

    initDrawingArea : function() {
        drawingAreaContainer = $('drawing-canvas-container');

        drawingAreaCanvas = document.createElement("canvas");
        drawingAreaCanvas.className = 'canvas';
        drawingAreaCanvas.setAttribute('width', '' + framePixelWidth * drawingCanvasDpi);
        drawingAreaCanvas.setAttribute('height', '' + framePixelHeight * drawingCanvasDpi);

        drawingAreaContainer.setAttribute('style', 
          'width:' + framePixelWidth * drawingCanvasDpi + 'px; height:' + framePixelHeight * drawingCanvasDpi + 'px;');

        drawingAreaCanvas.setAttribute('oncontextmenu', 'piskel.onCanvasContextMenu(event)');
        drawingAreaContainer.appendChild(drawingAreaCanvas);

        var body = document.getElementsByTagName('body')[0];
        body.setAttribute('onmouseup', 'piskel.onCanvasMouseup(event)');
        drawingAreaContainer.setAttribute('onmousedown', 'piskel.onCanvasMousedown(event)');
        drawingAreaContainer.setAttribute('onmousemove', 'piskel.onCanvasMousemove(event)');
        this.drawFrameToCanvas(frameSheet.getFrameByIndex(this.getActiveFrameIndex()), drawingAreaCanvas, drawingCanvasDpi);
    },

    initPreviewSlideshow: function() {
      var addFrameButton = $('add-frame-button');
      addFrameButton.addEventListener('mousedown', function() {
        frameSheet.addEmptyFrame();
        piskel.setActiveFrameAndRedraw(frameSheet.getFrameCount() - 1);
      });
      this.createPreviews();
    },

    initAnimationPreview : function() {

      var previewAnimationContainer = $('preview-canvas-container');
      previewCanvas = document.createElement('canvas');
      previewCanvas.className = 'canvas';
      previewAnimationContainer.setAttribute('style', 
        'width:' + framePixelWidth * previewAnimationCanvasDpi + 'px; height:' + framePixelHeight * previewAnimationCanvasDpi + 'px;');
      previewAnimationContainer.appendChild(previewCanvas);
      previewCanvas.setAttribute('width', framePixelWidth * previewAnimationCanvasDpi);
      previewCanvas.setAttribute('height', framePixelHeight * previewAnimationCanvasDpi);
    },

    startAnimation : function () {
      var scope = this;
      var animFPSTuner = document.getElementById("preview-fps");
      var animPreviewFPS = parseInt(animFPSTuner.value, 10);
      var startPreviewRefresh = function() {
        return setInterval(scope.refreshAnimatedPreview, 1000/animPreviewFPS);
      };
      var refreshUpdater = startPreviewRefresh();
      
      animFPSTuner.addEventListener('change', function(evt) {
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
        $("display-fps").innerHTML = animPreviewFPS + " fps";
        animFPSTuner.value = animPreviewFPS;
        $("fps-value").innerHTML = animPreviewFPS + " fps";
        refreshUpdater = startPreviewRefresh();
      });
    },

    createPreviews : function () {
      var container = $('preview-list'), previewTile;
      container.innerHTML = "";
      for (var i = 0, l = frameSheet.getFrameCount(); i < l ; i++) {
        previewTile = this.createPreviewTile(i);
        container.appendChild(previewTile);
      }
    },

    createPreviewTile: function(tileNumber) {
      var previewTileRoot = document.createElement("li");
      var classname = "preview-tile";

      if (this.getActiveFrameIndex() == tileNumber) {
        classname += " selected";
      }
      previewTileRoot.className = classname;
      
      var canvasContainer = document.createElement("div");
      canvasContainer.className = "canvas-container";
      canvasContainer.setAttribute('style', 
        'width:' + framePixelWidth * previewTileCanvasDpi + 'px; height:' + framePixelHeight * previewTileCanvasDpi + 'px;');
      
      var canvasBackground = document.createElement("div");
      canvasBackground.className = "canvas-background";
      canvasContainer.appendChild(canvasBackground);

      var canvasPreview = document.createElement("canvas");
      canvasPreview.className = "canvas tile-view"
      
      canvasPreview.setAttribute('width', framePixelWidth * previewTileCanvasDpi);
      canvasPreview.setAttribute('height', framePixelHeight * previewTileCanvasDpi);     
      
      previewTileRoot.addEventListener('click', function(evt) {
        // has not class tile-action:
        // TODO: let me know when you want to start using a framework :)
        if(!evt.target.className.match(new RegExp('(\\s|^)'+ 'tile-action' +'(\\s|$)'))) {
          piskel.setActiveFrameAndRedraw(tileNumber);
        }    
      });

      var canvasPreviewDuplicateAction = document.createElement("button");
      canvasPreviewDuplicateAction.className = "tile-action"
      canvasPreviewDuplicateAction.innerHTML = "dup"

      canvasPreviewDuplicateAction.addEventListener('click', function(evt) {
        piskel.duplicateFrame(tileNumber);
      });

      this.drawFrameToCanvas(frameSheet.getFrameByIndex(tileNumber), canvasPreview, previewTileCanvasDpi);
      canvasContainer.appendChild(canvasPreview);
      previewTileRoot.appendChild(canvasContainer);
      previewTileRoot.appendChild(canvasPreviewDuplicateAction);
      
      if(tileNumber > 0 || frameSheet.getFrameCount() > 1) {
        var canvasPreviewDeleteAction = document.createElement("button");
        canvasPreviewDeleteAction.className = "tile-action"
        canvasPreviewDeleteAction.innerHTML = "del"
        canvasPreviewDeleteAction.addEventListener('click', function(evt) {
          piskel.removeFrame(tileNumber);
        });
        previewTileRoot.appendChild(canvasPreviewDeleteAction);
      }

      return previewTileRoot;
    },

    refreshAnimatedPreview : function () {
      piskel.drawFrameToCanvas(frameSheet.getFrameByIndex(animIndex), previewCanvas, previewAnimationCanvasDpi);
      animIndex++;
      if (animIndex == frameSheet.getFrameCount()) {
        animIndex = 0;
      }
    },

    removeFrame: function(frameIndex) {     
      frameSheet.removeFrameByIndex(frameIndex);

      this.setActiveFrameAndRedraw(frameIndex - 1);
    },

    duplicateFrame: function(frameIndex) {
      frameSheet.duplicateFrameByIndex(frameIndex);

      this.setActiveFrameAndRedraw(frameIndex + 1);
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
      var coords = this.getRelativeCoordinates(event.clientX, event.clientY);
      if(event.button == 0) {
        this.drawAt(coords.x, coords.y, penColor);
      } else {
        // Right click used to delete.
        isRightClicked = true;
        this.drawAt(coords.x, coords.y, TRANSPARENT_COLOR);
      }
    },

    onCanvasMousemove : function (event) {
      //this.updateCursorInfo(event);
      if (isClicked) {
        var coords = this.getRelativeCoordinates(event.clientX, event.clientY);
        if(isRightClicked) {
          this.drawAt(coords.x, coords.y, TRANSPARENT_COLOR);
        } else {
          this.drawAt(coords.x, coords.y, penColor);
        }
      }
    },
    
    onCanvasMouseup : function (event) {
      if(isClicked || isRightClicked) {
        // A mouse button was clicked on the drawing canvas before this mouseup event,
        // the user was probably drawing on the canvas.
        // Note: The mousemove movement (and the mouseup) may end up outside
        // of the drawing canvas.
        this.createPreviews();
      }
      isClicked = false;
      isRightClicked = false;
    },

    drawAt : function (x, y, color) {
      var col = (x - x%drawingCanvasDpi) / drawingCanvasDpi;
      var row = (y - y%drawingCanvasDpi) / drawingCanvasDpi;
      
      // Update model:
      var currentFrame = frameSheet.getFrameByIndex(this.getActiveFrameIndex());
      
      // TODO: make a better accessor for pixel state update:
      // TODO: Make pen color dynamic:
      var color = _normalizeColor(color);
      if (color != currentFrame[col][row]) {
        currentFrame[col][row] = color;
        this.drawPixelInCanvas(row, col, color, drawingAreaCanvas, drawingCanvasDpi);
      }

      // Persist to localStorage when drawing. We throttle localStorage accesses
      // for high frequency drawing (eg mousemove).
      if(localStorageThrottler == null) {
          localStorageThrottler = window.setTimeout(function() {
            piskel.persistToLocalStorage();
            localStorageThrottler = null;
          }, 1000);
      }
      
           
    },

    drawPixelInCanvas : function (row, col, color, canvas, dpi) {
      var context = canvas.getContext('2d');
      if(color == undefined || color == TRANSPARENT_COLOR) {
        context.clearRect(col * dpi, row * dpi, dpi, dpi);   
      } else {
        this.addColorToPalette(color);
        context.fillStyle = color;
        context.fillRect(col * dpi, row * dpi, dpi, dpi);
      }
    },

    // TODO: move that to a FrameRenderer (/w cache) ?
    drawFrameToCanvas: function(frame, canvasElement, dpi) {
      var color;
      for(var col = 0, num_col = frame.length; col < num_col; col++) {
        for(var row = 0, num_row = frame[col].length; row < num_row; row++) {
          color = _normalizeColor(frame[col][row]);
          this.drawPixelInCanvas(row, col, color, canvasElement, dpi);
        }
      }
    },

    onCanvasContextMenu : function (event) {
      event.preventDefault();
      event.stopPropagation();
      event.cancelBubble = true;
      return false;
    },

    onPaletteClick : function (event) {
      var color = event.target.getAttribute("data-color");
      if (null !== color) {
        var colorPicker = $('color-picker');
        colorPicker.color.fromString(color);
        this.onPickerChange();
      }
    },
    
    getRelativeCoordinates : function (x, y) {
      var canvasRect = drawingAreaCanvas.getBoundingClientRect();
      return {
        x : x - canvasRect.left,
        y : y - canvasRect.top
      }
    },

    storeSheet : function (event) {
      var xhr = new XMLHttpRequest();
      var formData = new FormData();
      formData.append('framesheet_content', frameSheet.serialize());
      formData.append('fps_speed', $('preview-fps').value);
      xhr.open('POST', PISKEL_SERVICE_URL + "/store", true);
      xhr.onload = function(e) {
        if (this.status == 200) {
          var baseUrl = window.location.href.replace(window.location.search, "");
          window.location.href = baseUrl + "?frameId=" + this.responseText;
        }
      };

      xhr.send(formData);

      event.stopPropagation();
      event.preventDefault();
      return false;
    }
  };

  window.piskel = piskel;
  piskel.init();

})(function(id){return document.getElementById(id)});
//small change for checking my git setup :(
