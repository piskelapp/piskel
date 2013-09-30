(function () {
  var ns = $.namespace("pskl.controller");
  ns.PreviewFilmController = function (piskelController, container, dpi) {

    this.piskelController = piskelController;
    this.container = container;
    this.dpi = this.calculateDPI_();

    this.redrawFlag = true;
  };

  ns.PreviewFilmController.prototype.init = function() {
    $.subscribe(Events.TOOL_RELEASED, this.flagForRedraw_.bind(this));
    $.subscribe(Events.PISKEL_RESET, this.flagForRedraw_.bind(this));
    $.subscribe(Events.PISKEL_RESET, this.refreshDPI_.bind(this));

    $('#preview-list-scroller').scroll(this.updateScrollerOverflows.bind(this));
    this.updateScrollerOverflows();
  };

  ns.PreviewFilmController.prototype.addFrame = function () {
    this.piskelController.addEmptyFrame();
    this.piskelController.setCurrentFrameIndex(this.piskelController.getFrameCount() - 1);
    this.updateScrollerOverflows();
  };

  ns.PreviewFilmController.prototype.flagForRedraw_ = function () {
    this.redrawFlag = true;
  };

  ns.PreviewFilmController.prototype.refreshDPI_ = function () {
    this.dpi = this.calculateDPI_();
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
    newFrameButton.innerHTML = "<p class='label'>Add new frame</p>";
    this.container.append(newFrameButton);

    $(newFrameButton).click(this.addFrame.bind(this));

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

    // TODO(grosbouddha): move localstorage request to the model layer?
    $.publish(Events.LOCALSTORAGE_REQUEST);
  };


  /**
   * @private
   * TODO(vincz): clean this giant rendering function & remove listeners.
   */
  ns.PreviewFilmController.prototype.createPreviewTile_ = function(tileNumber) {
    var currentFrame = this.piskelController.getCurrentLayer().getFrameAt(tileNumber);

    var previewTileRoot = document.createElement("li");
    var classname = "preview-tile";
    previewTileRoot.setAttribute("data-tile-number", tileNumber);

    if (this.piskelController.getCurrentFrame() == currentFrame) {
      classname += " selected";
    }
    previewTileRoot.className = classname;

    var canvasContainer = document.createElement("div");
    canvasContainer.className = "canvas-container";

    var canvasBackground = document.createElement("div");
    canvasBackground.className = "canvas-background";
    canvasContainer.appendChild(canvasBackground);

    previewTileRoot.addEventListener('click', this.onPreviewClick_.bind(this, tileNumber));

    var cloneFrameButton = document.createElement("button");
    cloneFrameButton.setAttribute('rel', 'tooltip');
    cloneFrameButton.setAttribute('data-placement', 'right');
    cloneFrameButton.setAttribute('title', 'Duplicate this frame');
    cloneFrameButton.className = "tile-overlay duplicate-frame-action";
    previewTileRoot.appendChild(cloneFrameButton);
    cloneFrameButton.addEventListener('click', this.onAddButtonClick_.bind(this, tileNumber));

    // TODO(vincz): Eventually optimize this part by not recreating a FrameRenderer. Note that the real optim
    // is to make this update function (#createPreviewTile) less aggressive.
    var renderingOptions = {"dpi": this.dpi };
    var currentFrameRenderer = new pskl.rendering.FrameRenderer($(canvasContainer), renderingOptions, ["tile-view"]);
    currentFrameRenderer.render(currentFrame);

    previewTileRoot.appendChild(canvasContainer);

    if(tileNumber > 0 || this.piskelController.getFrameCount() > 1) {
      // Add 'remove frame' button.
      var deleteButton = document.createElement("button");
      deleteButton.setAttribute('rel', 'tooltip');
      deleteButton.setAttribute('data-placement', 'right');
      deleteButton.setAttribute('title', 'Delete this frame');
      deleteButton.className = "tile-overlay delete-frame-action";
      deleteButton.addEventListener('click', this.onDeleteButtonClick_.bind(this, tileNumber));
      previewTileRoot.appendChild(deleteButton);

      // Add 'dragndrop handle'.
      var dndHandle = document.createElement("div");
      dndHandle.className = "tile-overlay dnd-action";
      previewTileRoot.appendChild(dndHandle);
    }
    var tileCount = document.createElement("div");
    tileCount.className = "tile-overlay tile-count";
    tileCount.innerHTML = tileNumber;
    previewTileRoot.appendChild(tileCount);


    return previewTileRoot;
  };

  ns.PreviewFilmController.prototype.onPreviewClick_ = function (index, evt) {
    // has not class tile-action:
    if(!evt.target.classList.contains('tile-overlay')) {
      this.piskelController.setCurrentFrameIndex(index);
    }
  };

  ns.PreviewFilmController.prototype.onDeleteButtonClick_ = function (index, evt) {
    this.piskelController.removeFrameAt(index);
    $.publish(Events.LOCALSTORAGE_REQUEST); // Should come from model
    this.updateScrollerOverflows();
  };

  ns.PreviewFilmController.prototype.onAddButtonClick_ = function (index, evt) {
    this.piskelController.duplicateFrameAt(index);
    $.publish(Events.LOCALSTORAGE_REQUEST);  // Should come from model
    this.piskelController.setCurrentFrameIndex(index + 1);
    this.updateScrollerOverflows();
  };

  /**
   * Calculate the preview DPI depending on the piskel size
   */
  ns.PreviewFilmController.prototype.calculateDPI_ = function () {
    var curFrame = this.piskelController.getCurrentFrame(),
      frameHeight = curFrame.getHeight(),
      frameWidth = curFrame.getWidth(),
      maxFrameDim = Math.max(frameWidth, frameHeight);

    var previewHeight = Constants.PREVIEW_FILM_SIZE * frameHeight / maxFrameDim;
    var previewWidth = Constants.PREVIEW_FILM_SIZE * frameWidth / maxFrameDim;

    return pskl.PixelUtils.calculateDPI(previewHeight, previewWidth, frameHeight, frameWidth) || 1;
  };
})();