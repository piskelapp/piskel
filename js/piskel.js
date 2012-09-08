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

      activeFrameIndex = -1,       
      currentFrame = null;

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
        $('#drawing-canvas-container'), 
        drawingCanvasDpi
      );

      this.setActiveFrame(0);

      this.animationController = new pskl.controller.AnimatedPreviewController(
        frameSheet,
        $('#preview-canvas-container'), 
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

      $.subscribe('SET_ACTIVE_FRAME', function(evt, frameId) {
        piskel.setActiveFrameAndRedraw(frameId);
      });

      $.subscribe('FRAMESHEET_RESET', function(evt, frameId) {
        piskel.redraw();
      });
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
      var availableViewportHeight = $('.main-panel').height();
      return Math.floor(availableViewportHeight / framePixelHeight);    
    },

    finishInit : function () {

      

      $.subscribe(Events.REFRESH, function() {
        piskel.setActiveFrameAndRedraw(0);
      });

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
