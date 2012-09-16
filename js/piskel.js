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
      // Main drawing area dpi is calculated dynamically
      // Canvas preview film canvases:
      previewTileCanvasDpi = 4,
      // Animated canvas preview:
      previewAnimationCanvasDpi = 8;

  /**
   * Main application controller
   */
  var piskel = {

    init : function () {
      frameSheet = new pskl.model.FrameSheet(framePixelWidth, framePixelHeight);
      frameSheet.addEmptyFrame();
      
      this.drawingController = new pskl.controller.DrawingController(
        frameSheet,
        $('#drawing-canvas-container'), 
        this.calculateDPIsForDrawingCanvas_()
      );

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

      // To catch the current active frame, the selection manager have to be initialized before
      // the 'frameSheet.setCurrentFrameIndex(0);' line below.
      // TODO(vincz): Slice each constructor to have:
      //                  - an event(s) listening init
      //                  - an event(s) triggering init
      // All listeners will be hook in a first step, then all event triggering inits will be called
      // in a second batch.
      this.selectionManager =
          new pskl.selection.SelectionManager(frameSheet, this.drawingController.overlayFrame);

      // DO NOT MOVE THIS LINE (see comment above)
      frameSheet.setCurrentFrameIndex(0);

      this.animationController.init();
      this.previewsController.init();

      this.historyService = new pskl.service.HistoryService(frameSheet);
      this.historyService.init();

      this.keyboardEventService = new pskl.service.KeyboardEventService();
      this.keyboardEventService.init();

      this.notificationController = new pskl.controller.NotificationController();
      this.notificationController.init();

      this.localStorageService = new pskl.service.LocalStorageService(frameSheet);
      this.localStorageService.init();

      // TODO: Add comments 
      var framesheetId = this.getFramesheetIdFromUrl();
      if (framesheetId) {
        $.publish(Events.SHOW_NOTIFICATION, [{"content": "Loading animation with id : [" + framesheetId + "]"}]);
        this.loadFramesheetFromService(framesheetId);
      } else {
        this.finishInit();
        this.localStorageService.displayRestoreNotification();
      }

      var drawingLoop = new pskl.rendering.DrawingLoop();
      drawingLoop.addCallback(this.render, this);
      drawingLoop.start();

      // Init (event-delegated) bootstrap tooltips:
      $('body').tooltip({
        selector: '[rel=tooltip]'
      });

      this.connectResizeToDpiUpdate_();
    },

    render : function (delta) {
      this.drawingController.render(delta);
      this.animationController.render(delta);
      this.previewsController.render(delta);
    },

    connectResizeToDpiUpdate_ : function () {
      $(window).resize($.proxy(this.startDPIUpdateTimer_, this));
    },

    startDPIUpdateTimer_ : function () {
      if (this.dpiUpdateTimer) window.clearInterval(this.dpiUpdateTimer);
      this.dpiUpdateTimer = window.setTimeout($.proxy(this.updateDPIForViewport, this), 200);
    },

    updateDPIForViewport : function () {
      var dpi = piskel.calculateDPIsForDrawingCanvas_();
      this.drawingController.updateDPI(dpi);
    },

    /**
     * @private
     */
    calculateDPIsForDrawingCanvas_ : function() {

      var userMessageGap = 80; // Reserve some height to show the user message at the bottom

      var availableViewportHeight = $('.main-panel').height() - userMessageGap,
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
      var toolController = new pskl.controller.ToolController();
      toolController.init();
      
      var paletteController = new pskl.controller.PaletteController();
      paletteController.init(frameSheet);
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
        $.publish(Events.HIDE_NOTIFICATION);
        piskel.finishInit();
      };

      xhr.onerror = function () {
        $.publish(Events.HIDE_NOTIFICATION);
        piskel.finishInit();
      };

      xhr.send();
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
