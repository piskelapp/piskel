/**
 * @require Constants
 * @require Events
 */
$.namespace("pskl");

(function () {

  /**
   * FrameSheetModel instance.
   */
  var frameSheet, renderer = null,

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
      
      // States:
      isClicked = false, 
      isRightClicked = false, 
      activeFrameIndex = -1, 
      animIndex = 0,
      penColor = Constants.DEFAULT_PEN_COLOR,
      currentFrame = null;
      currentToolBehavior = null,
      previousMousemoveTime = 0;

  /**
   * Main application controller
   */
  var piskel = {

    init : function () {
      var emptyFrame = pskl.model.Frame.createEmpty(framePixelWidth, framePixelHeight);

      this.drawingController = new pskl.controller.DrawingController(
        emptyFrame,
        $('#drawing-canvas-container')[0], 
        drawingCanvasDpi
      );

      renderer = new pskl.rendering.FrameRenderer();

      frameSheet = new pskl.model.FrameSheet();
      frameSheet.addFrame(emptyFrame);
      this.setActiveFrame(0);
          
      pskl.NotificationService.init();
      pskl.LocalStorageService.init(frameSheet);

      // TODO: Add comments 
      var framesheetId = this.getFramesheetIdFromUrl();
      if (framesheetId) {
        $.publish(Events.SHOW_NOTIFICATION, [{"content": "Loading animation with id : [" + framesheetId + "]"}]);
        this.loadFramesheetFromService(framesheetId);
      } else {
        this.finishInit();
        pskl.LocalStorageService.displayRestoreNotification();
      }
    },

    finishInit : function () {

      $.subscribe(Events.TOOL_SELECTED, function(evt, toolBehavior) {
        console.log("Tool selected: ", toolBehavior);
        currentToolBehavior = toolBehavior;
      });

      $.subscribe(Events.COLOR_SELECTED, function(evt, color) {
        console.log("Color selected: ", color);
        penColor = color;
      });

      $.subscribe(Events.REFRESH, function() {
        piskel.setActiveFrameAndRedraw(0);
      });

      // TODO: Move this into their service or behavior files:
      this.initDrawingArea();
      this.initPreviewSlideshow(); 
      this.initAnimationPreview();  
      this.startAnimation();
      
      pskl.ToolSelector.init();
      pskl.Palette.init(frameSheet);
    },

    getFramesheetIdFromUrl : function() {
      var href = window.location.href;
      // TODO: Change frameId to framesheetId on the backend
      if (href.indexOf('frameId=') != -1) {
        return href.substring(href.indexOf('frameId=')+8);
      }
    },

    loadFramesheetFromService : function (frameId) {
      var xhr = new XMLHttpRequest();
      // TODO: Change frameId to framesheetId on the backend
      xhr.open('GET', Constants.PISKEL_SERVICE_URL + '/get?l=' + frameId, true);
      xhr.responseType = 'text';

      xhr.onload = function(e) {
        frameSheet.deserialize(this.responseText);
        piskel.setActiveFrame(0);  
        $.publish(Events.HIDE_NOTIFICATION);
        piskel.finishInit();
        piskel.setActiveFrameAndRedraw(0);  
      };

      xhr.onerror = function () {
        $.publish(Events.HIDE_NOTIFICATION);
        piskel.finishInit();
        piskel.setActiveFrameAndRedraw(0);
      };

      xhr.send();
    },

    setActiveFrame: function(index) {
      activeFrameIndex = index;
      this.drawingController.frame = frameSheet.getFrameByIndex(index); 
    },

    setActiveFrameAndRedraw: function(index) {
      this.setActiveFrame(index);
      
      // When redraw engine is refactored, remove the following crap and
      // trigger an event instead:

      // Update drawing canvas:
      this.drawingController.renderFrame();
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

    initDrawingArea : function() {
        drawingAreaContainer = $('#drawing-canvas-container')[0];
        document.body.addEventListener('mouseup', this.onMouseup.bind(this));
        drawingAreaContainer.addEventListener('mousedown', this.onMousedown.bind(this));
        drawingAreaContainer.addEventListener('mousemove', this.onMousemove.bind(this));
        drawingAreaContainer.style.width = framePixelWidth * drawingCanvasDpi + "px";
        drawingAreaContainer.style.height = framePixelHeight * drawingCanvasDpi + "px";
        drawingAreaContainer.addEventListener('contextmenu', this.onCanvasContextMenu);
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
      console.log("createPreviews");
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
        if(!evt.target.classList.contains('tile-action')) {
          piskel.setActiveFrameAndRedraw(tileNumber);
        }    
      });

      var canvasPreviewDuplicateAction = document.createElement("button");
      canvasPreviewDuplicateAction.className = "tile-action"
      canvasPreviewDuplicateAction.innerHTML = "dup"

      canvasPreviewDuplicateAction.addEventListener('click', function(evt) {
        piskel.duplicateFrame(tileNumber);
      });

      renderer.render(frameSheet.getFrameByIndex(tileNumber), canvasPreview, previewTileCanvasDpi);
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
      renderer.render(frameSheet.getFrameByIndex(animIndex), previewCanvas, previewAnimationCanvasDpi);
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

    onMousedown : function (event) {
      isClicked = true;
      
      if(event.button == 2) { // right click
        isRightClicked = true;
        $.publish(Events.CANVAS_RIGHT_CLICKED);
      }
      var spriteCoordinate = this.getSpriteCoordinate(event);
      currentToolBehavior.applyToolAt(
        spriteCoordinate.col,
        spriteCoordinate.row,
        penColor,
        this.drawingController
      );
        
      $.publish(Events.LOCALSTORAGE_REQUEST);
    },

    onMousemove : function (event) {
      var currentTime = new Date().getTime();
      // Throttling of the mousemove event:
      if ((currentTime - previousMousemoveTime) > 40 ) {
        if (isClicked) {
          var spriteCoordinate = this.getSpriteCoordinate(event);
          currentToolBehavior.moveToolAt(
            spriteCoordinate.col,
            spriteCoordinate.row,
            penColor,
            this.drawingController
          );
          
          // TODO(vincz): Find a way to move that to the model instead of being at the interaction level.
          // Eg when drawing, it may make sense to have it here. However for a non drawing tool,
          // you don't need to draw anything when mousemoving and you request useless localStorage.
          $.publish(Events.LOCALSTORAGE_REQUEST);
        }
        previousMousemoveTime = currentTime;
      }
    },
    
    onMouseup : function (event) {
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
          penColor,
          this.drawer
        );
    },

    onCanvasContextMenu : function (event) {
      event.preventDefault();
      event.stopPropagation();
      event.cancelBubble = true;
      return false;
    },

    getRelativeCoordinates : function (x, y) {
      var canvasRect = $(".canvas-main")[0].getBoundingClientRect();
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
      // TODO Refactor using jquery ?
      var xhr = new XMLHttpRequest();
      var formData = new FormData();
      formData.append('framesheet_content', frameSheet.serialize());
      formData.append('fps_speed', $('#preview-fps').val());
      xhr.open('POST', Constants.PISKEL_SERVICE_URL + "/store", true);
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

})();
