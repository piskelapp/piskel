/**
 * @require Constants
 * @require Events
 */
$.namespace("pskl");

(function () {
  var frameSheet,

      // Constants:
      DEFAULT_PEN_COLOR = '#000000',
      PISKEL_SERVICE_URL = 'http://2.piskel-app.appspot.com',

      // Temporary zoom implementation to easily get bigger canvases to
      // see how good perform critical algorithms on big canvas.
      zoom = 1,

      // Configuration:
      // Canvas size in pixel size (not dpi related)
      framePixelWidth = 32 * zoom, 
      framePixelHeight = 32 * zoom,


      // Scaling factors for a given frameSheet rendering:
      // Main drawing area:
      drawingCanvasDpi = Math.ceil(20/ zoom),
      // Canvas previous in the slideshow:
      previewTileCanvasDpi = Math.ceil(4 / zoom),
      // Ainmated canvas preview:
      previewAnimationCanvasDpi = Math.ceil(8 / zoom),

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
      currentFrame = null;
      currentToolBehavior = null,
      previousMousemoveTime = 0,

      //utility
      _normalizeColor = function (color) {
        if(color == undefined || color == Constants.TRANSPARENT_COLOR || color.indexOf("#") == 0) {
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
      frameSheet.addEmptyFrame();
      this.setActiveFrame(0);
      
      var frameId = this.getFrameIdFromUrl();
      if (frameId) {
        this.displayMessage("Loading animation with id : [" + frameId + "]");
        this.loadFramesheetFromService(frameId);
      } else {
        this.finishInit();
      }
    },

    finishInit : function () {

      $.subscribe(Events.TOOL_SELECTED, function(evt, toolBehavior) {
        console.log("Tool selected: ", toolBehavior);
        currentToolBehavior = toolBehavior;
      });

      this.initPalette();
      this.initDrawingArea();
      this.initPreviewSlideshow();
      this.initAnimationPreview();
      this.initColorPicker();
      this.initLocalStorageBackup();
      pskl.ToolSelector.init();

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
        piskel.removeMessage();
        piskel.finishInit();
      };

      xhr.onerror = function () {
        piskel.removeMessage();
        piskel.finishInit();
      };

      xhr.send();
    },

    initLocalStorageBackup: function() {
      if(window.localStorage && window.localStorage['snapShot']) {
        var reloadLink = "<a href='#' onclick='piskel.restoreFromLocalStorage()'>reload</a>";
        var discardLink = "<a href='#' onclick='piskel.cleanLocalStorage()'>discard</a>";
        this.displayMessage("Non saved version found. " + reloadLink + " or " + discardLink);
      }
    },

    displayMessage : function (content) {
      var message = document.createElement('div');
      message.id = "user-message";
      message.className = "user-message";
      message.innerHTML = content;
      message.onclick = this.removeMessage;
      document.body.appendChild(message);
    },

    removeMessage : function () {
      var message = $("#user-message");
      if (message.length) {
        message.remove();
      }
    },

    persistToLocalStorageRequest: function() {
      // Persist to localStorage when drawing. We throttle localStorage accesses
      // for high frequency drawing (eg mousemove).
      if(localStorageThrottler != null) {
          window.clearTimeout(localStorageThrottler);
      }
      localStorageThrottler = window.setTimeout(function() {
        piskel.persistToLocalStorage();
        localStorageThrottler = null;
      }, 1000);
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
      currentFrame = frameSheet.getFrameByIndex(activeFrameIndex)
    },

    setActiveFrameAndRedraw: function(index) {
      this.setActiveFrame(index);
      
      // Update drawing canvas:
      this.drawFrameToCanvas(currentFrame, drawingAreaCanvas, drawingCanvasDpi);
      
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
      this.colorPicker = $('#color-picker');
      this.colorPicker.val(DEFAULT_PEN_COLOR);
      this.colorPicker.change(this.onPickerChange.bind(this));
    },

    onPickerChange : function(evt) {
        var inputPicker = $(evt.target);
        penColor = _normalizeColor(inputPicker.val());
    },

    initPalette : function (color) {
      paletteEl = $('#palette')[0];
    },

    addColorToPalette : function (color) {
      if (color && color != Constants.TRANSPARENT_COLOR && paletteColors.indexOf(color) == -1) {
        var colorEl = document.createElement("li");    
        colorEl.className = "palette-color";
        colorEl.setAttribute("data-color", color);
        colorEl.setAttribute("title", color);
        colorEl.style.background = color;
        paletteEl.appendChild(colorEl);
        paletteColors.push(color);
      }
    },

    initDrawingArea : function() {
        drawingAreaContainer = $('#drawing-canvas-container')[0];

        drawingAreaCanvas = document.createElement("canvas");
        drawingAreaCanvas.className = 'canvas';
        drawingAreaCanvas.setAttribute('width', '' + framePixelWidth * drawingCanvasDpi);
        drawingAreaCanvas.setAttribute('height', '' + framePixelHeight * drawingCanvasDpi);

        drawingAreaContainer.setAttribute('style', 
          'width:' + framePixelWidth * drawingCanvasDpi + 'px; height:' + framePixelHeight * drawingCanvasDpi + 'px;');

        drawingAreaCanvas.setAttribute('oncontextmenu', 'piskel.onCanvasContextMenu(event)');
        drawingAreaContainer.appendChild(drawingAreaCanvas);

        var body = document.getElementsByTagName('body')[0];
        body.setAttribute('onmouseup', 'piskel.onDocumentBodyMouseup(event)');
        drawingAreaContainer.setAttribute('onmousedown', 'piskel.onCanvasMousedown(event)');
        drawingAreaContainer.setAttribute('onmousemove', 'piskel.onCanvasMousemove(event)');
        this.drawFrameToCanvas(currentFrame, drawingAreaCanvas, drawingCanvasDpi);
    },

    initPreviewSlideshow: function() {
      var addFrameButton = $('#add-frame-button')[0];
      addFrameButton.addEventListener('mousedown', function() {
        frameSheet.addEmptyFrame();
        piskel.setActiveFrameAndRedraw(frameSheet.getFrameCount() - 1);
      });
      this.createPreviews();
    },

    initAnimationPreview : function() {

      var previewAnimationContainer = $('#preview-canvas-container')[0];
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
      var animFPSTuner = $("#preview-fps")[0];
      var animPreviewFPS = parseInt(animFPSTuner.value, 10);
      var startPreviewRefresh = function() {
        return setInterval(scope.refreshAnimatedPreview, 1000/animPreviewFPS);
      };
      var refreshUpdater = startPreviewRefresh();
      
      animFPSTuner.addEventListener('change', function(evt) {
        window.clearInterval(refreshUpdater);
        animPreviewFPS = parseInt(animFPSTuner.value, 10);
        $("#display-fps").html(animPreviewFPS + " fps");
        refreshUpdater = startPreviewRefresh();
      });
    },

    createPreviews : function () {
      var container = $('#preview-list')[0], previewTile;
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
      
      if(event.button == 2) { // right click
        isRightClicked = true;
        $.publish(Events.CANVAS_RIGHT_CLICKED);
      }
      var spriteCoordinate = this.getSpriteCoordinate(event);
      currentToolBehavior.applyToolAt(
          spriteCoordinate.col,
          spriteCoordinate.row,
          currentFrame,
          penColor,
          drawingAreaCanvas,
          drawingCanvasDpi);
     
      piskel.persistToLocalStorageRequest();
    },

    onCanvasMousemove : function (event) {

      //this.updateCursorInfo(event);
      var currentTime = new Date().getTime();
      // Throttling of the mousemove event:
      if ((currentTime - previousMousemoveTime) > 40 ) {
        if (isClicked) {
          var spriteCoordinate = this.getSpriteCoordinate(event);
          currentToolBehavior.moveToolAt(
              spriteCoordinate.col,
              spriteCoordinate.row,
              currentFrame,
              penColor,
              drawingAreaCanvas,
              drawingCanvasDpi);
          
          // TODO(vincz): Find a way to move that to the model instead of being at the interaction level.
          // Eg when drawing, it may make sense to have it here. However for a non drawing tool,
          // you don't need to draw anything when mousemoving and you request useless localStorage.
          piskel.persistToLocalStorageRequest();
        }
        previousMousemoveTime = currentTime;
      }
    },
    
    onDocumentBodyMouseup : function (event) {
      if(isClicked || isRightClicked) {
        // A mouse button was clicked on the drawing canvas before this mouseup event,
        // the user was probably drawing on the canvas.
        // Note: The mousemove movement (and the mouseup) may end up outside
        // of the drawing canvas.
        // TODO: Remove that when we have the centralized redraw loop
        this.createPreviews();
      }

      if(isRightClicked) {
        $.publish(Events.CANVAS_RIGHT_CLICK_RELEASED);
      }
      isClicked = false;
      isRightClicked = false;
      var spriteCoordinate = this.getSpriteCoordinate(event);
      currentToolBehavior.releaseToolAt(
          spriteCoordinate.col,
          spriteCoordinate.row,
          currentFrame,
          penColor,
          drawingAreaCanvas,
          drawingCanvasDpi);
    },

    // TODO(vincz/julz): Refactor to make this disappear in a big event-driven redraw loop 
    drawFrameToCanvas: function(frame, canvasElement, dpi) {
      var color;
      for(var col = 0, num_col = frame.length; col < num_col; col++) {
        for(var row = 0, num_row = frame[col].length; row < num_row; row++) {
          color = _normalizeColor(frame[col][row]);
          this.drawPixelInCanvas(row, col, color, canvasElement, dpi);
        }
      }
    },

    // TODO(vincz/julz): Refactor to make this disappear in a big event-driven redraw loop 
    drawPixelInCanvas : function (row, col, color, canvas, dpi) {
      var context = canvas.getContext('2d');
      if(color == undefined || color == Constants.TRANSPARENT_COLOR) {
        context.clearRect(col * dpi, row * dpi, dpi, dpi);   
      } else {
        context.fillStyle = color;
        context.fillRect(col * dpi, row * dpi, dpi, dpi);
      }
    },

    onCanvasContextMenu : function (event) {
      event.preventDefault();
      event.stopPropagation();
      event.cancelBubble = true;
      return false;
    },

    onPaletteClick : function (event) {
      var color = $(event.target).data("color");
      var colorPicker = $('#color-picker');
      if (color == "TRANSPARENT") {
        // We can set the current palette color to transparent.
        // You can then combine this transparent color with an advanced
        // tool for customized deletions. 
        // Eg: bucket + transparent: Delete a colored area
        //     Stroke + transparent: hollow out the equivalent of a stroke
        penColor = Constants.TRANSPARENT_COLOR;
        
        // The colorpicker can't be set to a transparent state.
        // We set its background to white and insert the
        // string "TRANSPARENT" to mimic this state:
        colorPicker[0].color.fromString("#fff");
        colorPicker.val("TRANSPARENT");
      } else if (null !== color) {
        colorPicker[0].color.fromString(color);
        penColor = color;
      }
    },
    
    getRelativeCoordinates : function (x, y) {
      var canvasRect = drawingAreaCanvas.getBoundingClientRect();
      return {
        x : x - canvasRect.left,
        y : y - canvasRect.top
      }
    },

    getSpriteCoordinate : function(event) {
        var coord = this.getRelativeCoordinates(event.x, event.y);
        var coords = this.getRelativeCoordinates(event.clientX, event.clientY);
        return {
          "col" : (coords.x - coords.x%drawingCanvasDpi) / drawingCanvasDpi,
          "row" : (coords.y - coords.y%drawingCanvasDpi) / drawingCanvasDpi
        }
    },

    // TODO(julz): Create package ?
    storeSheet : function (event) {
      var xhr = new XMLHttpRequest();
      var formData = new FormData();
      formData.append('framesheet_content', frameSheet.serialize());
      formData.append('fps_speed', $('#preview-fps').val());
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
