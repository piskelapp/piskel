/**
 * @require Constants
 * @require Events
 */
$.namespace("pskl");

(function () {

  /**
   * FrameSheetModel instance.
   */
  var frameSheet,

      // Configuration:
      // Canvas size in pixel size (not dpi related)
      framePixelWidth = 32, 
      framePixelHeight = 32,

      // Scaling factors for a given frameSheet rendering:
      // Main drawing area:
      drawingCanvasDpi = 20,   
      // Canvas preview film canvases:
      previewTileCanvasDpi = 4,
      // Animated canvas preview:
      previewAnimationCanvasDpi = 8,

      // DOM references:
      drawingAreaContainer,
      drawingAreaCanvas,
      previewCanvas,
      
      // States:
      isClicked = false, 
      isRightClicked = false, 
      activeFrameIndex = -1, 
      animIndex = 0,

      primaryColor = Constants.DEFAULT_PEN_COLOR,
      secondaryColor = Constants.TRANSPARENT_COLOR,

      currentFrame = null;
      currentToolBehavior = null,
      previousMousemoveTime = 0;

  /**
   * Main application controller
   */
  var piskel = {

    init : function () {

      piskel.initDPIs_();

      frameSheet = new pskl.model.FrameSheet(framePixelWidth, framePixelHeight);
      frameSheet.addEmptyFrame();

      this.drawingController = new pskl.controller.DrawingController(
        frameSheet.getFrameByIndex(0),
        $('#drawing-canvas-container')[0], 
        drawingCanvasDpi
      );

      this.setActiveFrame(0);

      this.animationController = new pskl.controller.AnimatedPreviewController(
        frameSheet,
        $('#preview-canvas-container')[0], 
        previewAnimationCanvasDpi
      );


      this.previewsController = new pskl.controller.PreviewFilmController(
        frameSheet,
        $('#preview-list'), 
        previewTileCanvasDpi
      );

      this.animationController.init();
      this.previewsController.init();

      pskl.HistoryManager.init();
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

    /**
     * Override default DPIs.
     * @private
     */
    initDPIs_ : function() {

      drawingCanvasDpi = piskel.calculateDPIsForDrawingCanvas_();
      // TODO(vincz): Add throttling on window.resize event.
      $(window).resize($.proxy(function() {
        drawingCanvasDpi = piskel.calculateDPIsForDrawingCanvas_();
        this.drawingController.updateDPI(drawingCanvasDpi);
      }, this));
      // TODO(vincz): Check for user settings eventually from localstorage.
    },

    /**
     * @private
     */
    calculateDPIsForDrawingCanvas_ : function() {
      var availableViewportHeight = $('.main-panel').height(),
          availableViewportWidth = $('.main-panel').width(),
          previewHeight = $(".preview-container").height(),
          previewWidth = $(".preview-container").width();

      var heightBoundDpi = Math.floor(availableViewportHeight / framePixelHeight),
          widthBoundDpi = Math.floor(availableViewportWidth / framePixelWidth);

      var dpi = Math.min(heightBoundDpi, widthBoundDpi);

      var drawingCanvasHeight = dpi * framePixelHeight;
      var drawingCanvasWidth = dpi * framePixelWidth;

      // Check if preview and drawing canvas overlap
      var heightGap =  drawingCanvasHeight + previewHeight - availableViewportHeight,
          widthGap = drawingCanvasWidth + previewWidth - availableViewportWidth;
      if (heightGap > 0 && widthGap > 0) {
          // Calculate the DPI change needed to bridge height and width gap
          var heightGapDpi = Math.ceil(heightGap / framePixelHeight),
          widthGapDpi = Math.ceil(widthGap / framePixelWidth);

          // substract smallest dpi change to initial dpi
          dpi -= Math.min(heightGapDpi, widthGapDpi);
      }
      
      return dpi;
    },

    finishInit : function () {

      $.subscribe(Events.TOOL_SELECTED, function(evt, toolBehavior) {
        console.log("Tool selected: ", toolBehavior);
        currentToolBehavior = toolBehavior;
      });

      $.subscribe(Events.COLOR_SELECTED, function(evt, color, isPrimary) {
        console.log("Color selected: ", color);
        if (isPrimary) {
          primaryColor = color;
        } else {
          secondaryColor = color;
        }
      });

      $.subscribe(Events.REFRESH, function() {
        piskel.setActiveFrameAndRedraw(0);
      });

      // TODO: Move this into their service or behavior files:
      this.initDrawingArea();
      
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
      this.drawingController.frame = this.getCurrentFrame(); 
    },

    setActiveFrameAndRedraw: function(index) {
      this.setActiveFrame(index);
      this.redraw();
    },

    redraw : function () {
      // Update drawing canvas:
      this.drawingController.renderFrame();
      // Update slideshow:
      this.previewsController.createPreviews();
    },

    getActiveFrameIndex: function() {
      if(-1 == activeFrameIndex) {
        throw "Bad active frame initialization."
      }
      return activeFrameIndex;
    },

    getCurrentFrame : function () {
      return frameSheet.getFrameByIndex(activeFrameIndex);
    },

    initDrawingArea : function() {
        drawingAreaContainer = $('#drawing-canvas-container')[0];
        document.body.addEventListener('mouseup', this.onMouseup.bind(this));
        drawingAreaContainer.addEventListener('mousedown', this.onMousedown.bind(this));
        drawingAreaContainer.addEventListener('mousemove', this.onMousemove.bind(this));
        document.body.addEventListener('contextmenu', this.onCanvasContextMenu);
    },

    removeFrame: function(frameIndex) {     
      frameSheet.removeFrameByIndex(frameIndex);
      var activeFrameIndex = frameIndex ? frameIndex - 1 : 0;
      this.setActiveFrameAndRedraw(activeFrameIndex);
    },

    duplicateFrame: function(frameIndex) {
      frameSheet.duplicateFrameByIndex(frameIndex);
      this.setActiveFrameAndRedraw(frameIndex + 1);
    },

    getCurrentColor : function () {
      if(isRightClicked) {
        return secondaryColor;
      } else {
        return primaryColor;
      }
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
        this.getCurrentColor(),
        this.drawingController
      );
        
      $.publish(Events.LOCALSTORAGE_REQUEST);
    },

    onMousemove : function (event) {
      var currentTime = new Date().getTime();
      // Throttling of the mousemove event:
      if ((currentTime - previousMousemoveTime) > 40 ) {
        var spriteCoordinate = this.getSpriteCoordinate(event);
        if (isClicked) {
          
          currentToolBehavior.moveToolAt(
            spriteCoordinate.col,
            spriteCoordinate.row,
            this.getCurrentColor(),
            this.drawingController
          );
          
          // TODO(vincz): Find a way to move that to the model instead of being at the interaction level.
          // Eg when drawing, it may make sense to have it here. However for a non drawing tool,
          // you don't need to draw anything when mousemoving and you request useless localStorage.
          $.publish(Events.LOCALSTORAGE_REQUEST);
        } else {
            // debug mode to see the selected pixel
            // this.drawingController.clearOverlay();
            // this.drawingController.overlay.setPixel( spriteCoordinate.col,spriteCoordinate.row, "#ff0000");
            // this.drawingController.renderOverlay();
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
        if(isRightClicked) {
          $.publish(Events.CANVAS_RIGHT_CLICK_RELEASED);
        }


        isClicked = false;
        isRightClicked = false;
        var spriteCoordinate = this.getSpriteCoordinate(event);
        currentToolBehavior.releaseToolAt(
          spriteCoordinate.col,
          spriteCoordinate.row,
          this.getCurrentColor(),
          this.drawingController
        );


        $.publish(Events.TOOL_RELEASED);
        // TODO: Remove that when we have the centralized redraw loop
        this.previewsController.createPreviews();
      }
    },

    onCanvasContextMenu : function (event) {
      event.preventDefault();
      event.stopPropagation();
      event.cancelBubble = true;
      return false;
    },

    getRelativeCoordinates : function (x, y) {
      var canvasRect = $(".drawing-canvas")[0].getBoundingClientRect();
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

      if(event) {
        event.stopPropagation();
        event.preventDefault();
      }
      return false;
    }
  };

  window.piskel = piskel;
  piskel.init();

})();
