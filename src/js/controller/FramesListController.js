(function () {
  var ns = $.namespace('pskl.controller');

  var ACTION = {
    SELECT : 'select',
    CLONE : 'clone',
    DELETE : 'delete',
    NEW_FRAME : 'newframe',
    TOGGLE: 'toggle'
  };

  ns.FramesListController = function (piskelController, container) {
    this.piskelController = piskelController;
    this.container = container;
    this.previewList = container.querySelector('#preview-list');
    this.refreshZoom_();

    this.redrawFlag = true;
    this.regenerateDomFlag = true;
    this.justDropped = false;

    this.cachedFrameProcessor = new pskl.model.frame.CachedFrameProcessor();
    this.cachedFrameProcessor.setFrameProcessor(this.frameToPreviewCanvas_.bind(this));
    this.cachedFrameProcessor.setOutputCloner(this.clonePreviewCanvas_.bind(this));

    this.initDragndropBehavior_();
  };

  ns.FramesListController.prototype.init = function() {
    $.subscribe(Events.TOOL_RELEASED, this.flagForRedraw_.bind(this));
    $.subscribe(Events.PISKEL_RESET, this.flagForRedraw_.bind(this, true));
    $.subscribe(Events.USER_SETTINGS_CHANGED, this.flagForRedraw_.bind(this));

    $.subscribe(Events.PISKEL_RESET, this.refreshZoom_.bind(this));

    this.previewListScroller = document.querySelector('#preview-list-scroller');
    this.previewListScroller.addEventListener('scroll', this.updateScrollerOverflows.bind(this));
    this.container.addEventListener('click', this.onContainerClick_.bind(this));
    this.updateScrollerOverflows();
  };

  ns.FramesListController.prototype.flagForRedraw_ = function (regenerateDom) {
    this.redrawFlag = true;

    if (regenerateDom) {
      this.regenerateDomFlag = true;
    }
  };

  ns.FramesListController.prototype.refreshZoom_ = function () {
    this.zoom = this.calculateZoom_();
  };

  ns.FramesListController.prototype.render = function () {
    if (this.redrawFlag) {
      if (this.regenerateDomFlag) {
        this.tiles = [];
        this.addFrameTile = null;
        this.createPreviews_();

        this.regenerateDomFlag = false;
      }

      this.updatePreviews_();
      this.redrawFlag = false;
    }
  };

  ns.FramesListController.prototype.updateScrollerOverflows = function () {
    var scroller = this.previewListScroller;
    var scrollerHeight = scroller.offsetHeight;
    var scrollTop = scroller.scrollTop;
    var scrollerContentHeight = this.previewList.offsetHeight;
    var threshold = this.container.querySelector('.top-overflow').offsetHeight;
    var overflowTop = false;
    var overflowBottom = false;

    if (scrollerHeight < scrollerContentHeight) {
      if (scrollTop > threshold) {
        overflowTop = true;
      }
      var scrollBottom = (scrollerContentHeight - scrollTop) - scrollerHeight;
      if (scrollBottom > threshold) {
        overflowBottom = true;
      }
    }
    this.container.classList.toggle('top-overflow-visible', overflowTop);
    this.container.classList.toggle('bottom-overflow-visible', overflowBottom);
  };

  ns.FramesListController.prototype.onContainerClick_ = function (event) {
    var target = pskl.utils.Dom.getParentWithData(event.target, 'tileAction');
    if (!target) {
      return;
    }
    var action = target.dataset.tileAction;
    var index = parseInt(target.dataset.tileNumber, 10);

    if (action === ACTION.CLONE) {
      this.piskelController.duplicateFrameAt(index);
      var clonedTile = this.createPreviewTile_(index + 1);
      this.previewList.insertBefore(clonedTile, this.tiles[index].nextSibling);
      this.tiles.splice(index, 0, clonedTile);
      this.updateScrollerOverflows();
    } else if (action === ACTION.DELETE) {
      this.piskelController.removeFrameAt(index);
      this.previewList.removeChild(this.tiles[index]);
      this.tiles.splice(index, 1);
      this.updateScrollerOverflows();
    } else if (action === ACTION.SELECT && !this.justDropped) {
      this.piskelController.setCurrentFrameIndex(index);
    } else if (action === ACTION.NEW_FRAME) {
      this.piskelController.addFrame();
      var newtile = this.createPreviewTile_(this.tiles.length);
      this.tiles.push(newtile);
      this.previewList.insertBefore(newtile, this.addFrameTile);
      this.updateScrollerOverflows();
    } else if (action == ACTION.TOGGLE) {
      this.piskelController.toggleFrameVisibilityAt(index);
    }

    this.flagForRedraw_();
  };

  ns.FramesListController.prototype.updatePreviews_ = function () {
    var i;
    var length;

    for (i = 0, length = this.tiles.length; i < length; i++) {
      // Remove selected class
      this.tiles[i].classList.remove('selected');

      // Remove toggle class
      this.tiles[i].querySelector('.tile-count').classList.remove('toggled');

      // Update tile numbers
      this.tiles[i].setAttribute('data-tile-number', i);
      this.tiles[i].querySelector('.tile-count').innerHTML = (i + 1);

      // Update visibility
      if (this.piskelController.hasVisibleFrameAt(i)) {
        this.tiles[i].querySelector('.tile-count').classList.add('toggled');
      }

      // Check if any tile is updated
      var hash = this.piskelController.getCurrentLayer().getFrameAt(i).getHash();
      if (this.tiles[i].getAttribute('data-tile-hash') !== hash) {
        if (this.tiles[i].querySelector('canvas')) {
          this.tiles[i].querySelector('.canvas-container').replaceChild(
            this.getCanvasForFrame(this.piskelController.getCurrentLayer().getFrameAt(i)),
            this.tiles[i].querySelector('canvas')
          );
        } else {
          this.tiles[i].querySelector('.canvas-container').appendChild(
            this.getCanvasForFrame(this.piskelController.getCurrentLayer().getFrameAt(i))
          );
        }
      }
    }

    // Hide/Show buttons if needed
    var buttons = this.container.querySelectorAll('.delete-frame-action, .dnd-action');
    var display = (this.piskelController.getFrameCount() > 1) ? 'block' : 'none';
    for (i = 0, length = buttons.length; i < length; i++) {
      buttons[i].style.display = display;
    }

    // Add selected class
    this.tiles[this.piskelController.getCurrentFrameIndex()].classList.add('selected');
  };

  ns.FramesListController.prototype.createPreviews_ = function () {
    this.previewList.innerHTML = '';

    // Manually remove tooltips since mouseout events were shortcut by the DOM refresh:
    var tooltips = document.querySelectorAll('.tooltip');
    Array.prototype.forEach.call(tooltips, function (tooltip) {
      tooltip.parentNode.removeChild(tooltip);
    });

    var frameCount = this.piskelController.getFrameCount();

    for (var i = 0 ; i < frameCount ; i++) {
      var tile = this.createPreviewTile_(i);
      this.previewList.appendChild(tile);
      this.tiles[i] = tile;
    }
    // Append 'new empty frame' button
    var newFrameButton = document.createElement('div');
    newFrameButton.id = 'add-frame-action';
    newFrameButton.className = 'add-frame-action';
    newFrameButton.setAttribute('data-tile-action', ACTION.NEW_FRAME);
    newFrameButton.innerHTML = '<div class="add-frame-action-icon icon-frame-plus-white">' +
      '</div><div class="label">Add new frame</div>';
    this.previewList.appendChild(newFrameButton);
    this.addFrameTile = newFrameButton;

    this.updateScrollerOverflows();
  };

  /**
   * @private
   */
  ns.FramesListController.prototype.initDragndropBehavior_ = function () {
    $(this.previewList).sortable({
      placeholder: 'preview-tile preview-tile-drop-proxy',
      update: this.onUpdate_.bind(this),
      stop: this.onSortableStop_.bind(this),
      items: '.preview-tile',
      axis: 'y',
      tolerance: 'pointer'
    });
    $(this.previewList).disableSelection();
  };

  /**
   * @private
   */
  ns.FramesListController.prototype.onUpdate_ = function (event, ui) {
    var movedItem = ui.item.get(0);
    var originFrameId = parseInt(movedItem.dataset.tileNumber, 10);
    var tiles = document.querySelectorAll('.preview-tile');
    var targetInsertionId = Array.prototype.indexOf.call(tiles, movedItem);

    this.piskelController.moveFrame(originFrameId, targetInsertionId);
    this.piskelController.setCurrentFrameIndex(targetInsertionId);

    var tile = this.tiles.splice(originFrameId, 1)[0];
    this.tiles.splice(targetInsertionId, 0, tile);
    this.flagForRedraw_();
  };

  /**
   * @private
   */
  ns.FramesListController.prototype.onSortableStop_ = function (event, ui) {
    this.justDropped = true;

    this.resizeTimer = window.setTimeout((function() {
      this.justDropped = false;
    }).bind(this), 200);
  };

  /**
   * @private
   */
  ns.FramesListController.prototype.createPreviewTile_ = function(tileNumber) {
    var currentFrame = this.piskelController.getCurrentLayer().getFrameAt(tileNumber);

    var previewTileRoot = document.createElement('li');
    previewTileRoot.setAttribute('data-tile-number', tileNumber);
    previewTileRoot.setAttribute('data-tile-hash', currentFrame.getHash());
    previewTileRoot.setAttribute('data-tile-action', ACTION.SELECT);
    previewTileRoot.classList.add('preview-tile');
    if (this.piskelController.getCurrentFrame() == currentFrame) {
      previewTileRoot.classList.add('selected');
    }

    var canvasContainer = document.createElement('div');
    canvasContainer.classList.add('canvas-container', pskl.UserSettings.get(pskl.UserSettings.CANVAS_BACKGROUND));

    var height = this.zoom * this.piskelController.getCurrentFrame().getHeight();
    var horizontalMargin = (Constants.PREVIEW_FILM_SIZE - height) / 2;
    canvasContainer.style.marginTop = horizontalMargin + 'px';

    var width = this.zoom * this.piskelController.getCurrentFrame().getWidth();
    var verticalMargin = (Constants.PREVIEW_FILM_SIZE - width) / 2;
    canvasContainer.style.marginLeft = verticalMargin + 'px';
    canvasContainer.style.marginRight = verticalMargin + 'px';

    // Add canvas background and canvas
    var canvasBackground = document.createElement('div');
    canvasBackground.className = 'canvas-background';
    canvasContainer.appendChild(canvasBackground);
    canvasContainer.appendChild(this.getCanvasForFrame(currentFrame));
    previewTileRoot.appendChild(canvasContainer);

    // Add clone button
    var cloneFrameButton = document.createElement('button');
    cloneFrameButton.setAttribute('rel', 'tooltip');
    cloneFrameButton.setAttribute('data-placement', 'right');
    cloneFrameButton.setAttribute('data-tile-number', tileNumber);
    cloneFrameButton.setAttribute('data-tile-action', ACTION.CLONE);
    cloneFrameButton.setAttribute('title', 'Duplicate this frame');
    cloneFrameButton.className = 'tile-overlay duplicate-frame-action icon-frame-duplicate-white';
    previewTileRoot.appendChild(cloneFrameButton);

    // Add delete button
    var deleteButton = document.createElement('button');
    deleteButton.setAttribute('rel', 'tooltip');
    deleteButton.setAttribute('data-placement', 'right');
    deleteButton.setAttribute('title', 'Delete this frame');
    deleteButton.setAttribute('data-tile-number', tileNumber);
    deleteButton.setAttribute('data-tile-action', ACTION.DELETE);
    deleteButton.className = 'tile-overlay delete-frame-action icon-frame-recyclebin-white';
    previewTileRoot.appendChild(deleteButton);

    // Add 'dragndrop handle'.
    var dndHandle = document.createElement('div');
    dndHandle.className = 'tile-overlay dnd-action icon-frame-dragndrop-white' ;
    previewTileRoot.appendChild(dndHandle);

    // Add tile count
    var tileCount = document.createElement('button');
    tileCount.setAttribute('rel', 'tooltip');
    tileCount.setAttribute('title', 'Toggle for preview');
    tileCount.setAttribute('data-tile-number', tileNumber);
    tileCount.setAttribute('data-tile-action', ACTION.TOGGLE);
    tileCount.className = 'tile-overlay tile-count toggle-frame-action';
    tileCount.innerHTML = tileNumber + 1;
    previewTileRoot.appendChild(tileCount);

    return previewTileRoot;
  };

  ns.FramesListController.prototype.getCanvasForFrame = function (frame) {
    var canvas = this.cachedFrameProcessor.get(frame, this.zoom);
    return canvas;
  };

  ns.FramesListController.prototype.frameToPreviewCanvas_ = function (frame) {
    var canvasRenderer = new pskl.rendering.CanvasRenderer(frame, this.zoom);
    canvasRenderer.drawTransparentAs(Constants.TRANSPARENT_COLOR);
    var canvas = canvasRenderer.render();
    canvas.classList.add('tile-view', 'canvas');
    return canvas;
  };

  ns.FramesListController.prototype.clonePreviewCanvas_ = function (canvas) {
    var clone = pskl.utils.CanvasUtils.clone(canvas);
    clone.classList.add('tile-view', 'canvas');
    return clone;
  };

  /**
   * Calculate the preview zoom depending on the piskel size
   */
  ns.FramesListController.prototype.calculateZoom_ = function () {
    var frame = this.piskelController.getCurrentFrame();
    var frameSize = Math.max(frame.getHeight(), frame.getWidth());

    return Constants.PREVIEW_FILM_SIZE / frameSize;
  };
})();
