(function () {
  var ns = $.namespace("pskl.controller");

  var ACTION = {
    SELECT : 'select',
    CLONE : 'clone',
    DELETE : 'delete',
    NEW_FRAME : 'newframe'
  };

  ns.PreviewFilmController = function (piskelController, container) {

    this.piskelController = piskelController;
    this.container = container;
    this.refreshZoom_();

    this.redrawFlag = true;
  };

  ns.PreviewFilmController.prototype.init = function() {
    $.subscribe(Events.TOOL_RELEASED, this.flagForRedraw_.bind(this));
    $.subscribe(Events.PISKEL_RESET, this.flagForRedraw_.bind(this));
    $.subscribe(Events.PISKEL_RESET, this.refreshZoom_.bind(this));

    $('#preview-list-scroller').scroll(this.updateScrollerOverflows.bind(this));
    this.container.get(0).addEventListener('click', this.onContainerClick_.bind(this));
    this.updateScrollerOverflows();
  };

  ns.PreviewFilmController.prototype.flagForRedraw_ = function () {
    this.redrawFlag = true;
  };

  ns.PreviewFilmController.prototype.refreshZoom_ = function () {
    this.zoom = this.calculateZoom_();
  };

  ns.PreviewFilmController.prototype.render = function () {
    if (this.redrawFlag) {
      // TODO(vincz): Full redraw on any drawing modification, optimize.
      this.createPreviews_();
      this.redrawFlag = false;
    }
  };

  ns.PreviewFilmController.prototype.updateScrollerOverflows = function () {
    var scroller = $('#preview-list-scroller');
    var scrollerHeight = scroller.height();
    var scrollTop = scroller.scrollTop();
    var scrollerContentHeight = $('#preview-list').height();
    var treshold = $('.top-overflow').height();
    var overflowTop = false,
      overflowBottom = false;
    if (scrollerHeight < scrollerContentHeight) {
      if (scrollTop > treshold) {
        overflowTop = true;
      }
      var scrollBottom = (scrollerContentHeight - scrollTop) - scrollerHeight;
      if (scrollBottom > treshold) {
        overflowBottom = true;
      }
    }
    var wrapper = $('#preview-list-wrapper');
    wrapper.toggleClass('top-overflow-visible', overflowTop);
    wrapper.toggleClass('bottom-overflow-visible', overflowBottom);
  };

  ns.PreviewFilmController.prototype.onContainerClick_ = function (event) {
    var target = pskl.utils.Dom.getParentWithData(event.target, 'tileAction');
    if (!target) {
      return;
    }
    var action = target.dataset.tileAction;
    var index = parseInt(target.dataset.tileNumber, 10);

    if (action === ACTION.CLONE) {
      this.piskelController.duplicateFrameAt(index);
      this.piskelController.setCurrentFrameIndex(index + 1);
      this.updateScrollerOverflows();
    } else if (action === ACTION.DELETE) {
      this.piskelController.removeFrameAt(index);
      this.updateScrollerOverflows();
    } else if (action === ACTION.SELECT) {
      this.piskelController.setCurrentFrameIndex(index);
    } else if (action === ACTION.NEW_FRAME) {
      this.piskelController.addFrame();
      this.piskelController.setCurrentFrameIndex(this.piskelController.getFrameCount() - 1);
      this.updateScrollerOverflows();
    }
  };

  ns.PreviewFilmController.prototype.createPreviews_ = function () {

    this.container.html("");
    // Manually remove tooltips since mouseout events were shortcut by the DOM refresh:
    $(".tooltip").remove();

    var frameCount = this.piskelController.getFrameCount();

    for (var i = 0, l = frameCount; i < l ; i++) {
      this.container.append(this.createPreviewTile_(i));
    }
    // Append 'new empty frame' button
    var newFrameButton = document.createElement("div");
    newFrameButton.id = "add-frame-action";
    newFrameButton.className = "add-frame-action";
    newFrameButton.setAttribute('data-tile-action', ACTION.NEW_FRAME);
    newFrameButton.innerHTML = "<p class='label'>Add new frame</p>";
    this.container.append(newFrameButton);

    var needDragndropBehavior = (frameCount > 1);
    if(needDragndropBehavior) {
      this.initDragndropBehavior_();
    }
    this.updateScrollerOverflows();
  };


  /**
   * @private
   */
  ns.PreviewFilmController.prototype.initDragndropBehavior_ = function () {

    $("#preview-list").sortable({
      placeholder: "preview-tile-drop-proxy",
      update: $.proxy(this.onUpdate_, this),
      items: ".preview-tile"
    });
    $("#preview-list").disableSelection();
  };

  /**
   * @private
   */
  ns.PreviewFilmController.prototype.onUpdate_ = function( event, ui ) {
    var originFrameId = parseInt(ui.item.data("tile-number"), 10);
    var targetInsertionId = $('.preview-tile').index(ui.item);

    this.piskelController.moveFrame(originFrameId, targetInsertionId);
    this.piskelController.setCurrentFrameIndex(targetInsertionId);
  };


  /**
   * @private
   * TODO(vincz): clean this giant rendering function & remove listeners.
   */
  ns.PreviewFilmController.prototype.createPreviewTile_ = function(tileNumber) {
    var currentFrame = this.piskelController.getCurrentLayer().getFrameAt(tileNumber);

    var previewTileRoot = document.createElement("li");
    previewTileRoot.setAttribute("data-tile-number", tileNumber);
    previewTileRoot.setAttribute('data-tile-action', ACTION.SELECT);
    previewTileRoot.classList.add("preview-tile");
    if (this.piskelController.getCurrentFrame() == currentFrame) {
      previewTileRoot.classList.add("selected");
    }

    var canvasContainer = document.createElement("div");
    canvasContainer.classList.add("canvas-container", pskl.UserSettings.get(pskl.UserSettings.CANVAS_BACKGROUND));


    var canvasBackground = document.createElement("div");
    canvasBackground.className = "canvas-background";
    canvasContainer.appendChild(canvasBackground);

    var cloneFrameButton = document.createElement("button");
    cloneFrameButton.setAttribute('rel', 'tooltip');
    cloneFrameButton.setAttribute('data-placement', 'right');
    cloneFrameButton.setAttribute('data-tile-number', tileNumber);
    cloneFrameButton.setAttribute('data-tile-action', ACTION.CLONE);
    cloneFrameButton.setAttribute('title', 'Duplicate this frame');
    cloneFrameButton.className = "tile-overlay duplicate-frame-action";
    previewTileRoot.appendChild(cloneFrameButton);

    var canvasRenderer = new pskl.rendering.CanvasRenderer(currentFrame, this.zoom);
    canvasRenderer.drawTransparentAs(Constants.TRANSPARENT_COLOR);
    var canvas = canvasRenderer.render();
    canvas.classList.add('tile-view', 'canvas');
    canvasContainer.appendChild(canvas);
    previewTileRoot.appendChild(canvasContainer);

    if(tileNumber > 0 || this.piskelController.getFrameCount() > 1) {
      // Add 'remove frame' button.
      var deleteButton = document.createElement("button");
      deleteButton.setAttribute('rel', 'tooltip');
      deleteButton.setAttribute('data-placement', 'right');
      deleteButton.setAttribute('title', 'Delete this frame');
      deleteButton.setAttribute('data-tile-number', tileNumber);
      deleteButton.setAttribute('data-tile-action', ACTION.DELETE);
      deleteButton.className = "tile-overlay delete-frame-action";
      previewTileRoot.appendChild(deleteButton);

      // Add 'dragndrop handle'.
      var dndHandle = document.createElement("div");
      dndHandle.className = "tile-overlay dnd-action";
      previewTileRoot.appendChild(dndHandle);
    }
    var tileCount = document.createElement("div");
    tileCount.className = "tile-overlay tile-count";
    tileCount.innerHTML = tileNumber + 1;
    previewTileRoot.appendChild(tileCount);

    return previewTileRoot;
  };

  /**
   * Calculate the preview zoom depending on the piskel size
   */
  ns.PreviewFilmController.prototype.calculateZoom_ = function () {
    var curFrame = this.piskelController.getCurrentFrame(),
      frameHeight = curFrame.getHeight(),
      frameWidth = curFrame.getWidth(),
      maxFrameDim = Math.max(frameWidth, frameHeight);

    var previewHeight = Constants.PREVIEW_FILM_SIZE * frameHeight / maxFrameDim;
    var previewWidth = Constants.PREVIEW_FILM_SIZE * frameWidth / maxFrameDim;

    return pskl.PixelUtils.calculateZoom(previewHeight, previewWidth, frameHeight, frameWidth) || 1;
  };
})();