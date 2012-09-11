(function () {
	var ns = $.namespace("pskl.controller");
	ns.PreviewFilmController = function (framesheet, container, dpi) {

		this.dpi = dpi;
		this.framesheet = framesheet;
		this.container = container;

		this.redrawFlag = true;

    	$.subscribe(Events.TOOL_RELEASED, this.flagForRedraw_.bind(this));
		$.subscribe(Events.FRAMESHEET_RESET, this.flagForRedraw_.bind(this));
	};

	ns.PreviewFilmController.prototype.init = function() {
		var addFrameButton = $('#add-frame-button')[0];
		addFrameButton.addEventListener('mousedown', this.addFrame.bind(this));
    };

    ns.PreviewFilmController.prototype.addFrame = function () {
 		this.framesheet.addEmptyFrame();
        this.framesheet.setCurrentFrameIndex(this.framesheet.getFrameCount() - 1);
    };

    ns.PreviewFilmController.prototype.flagForRedraw_ = function () {
    	this.redrawFlag = true;
    };

    ns.PreviewFilmController.prototype.render = function () {
		if (this.redrawFlag) {
			// TODO(vincz): Full redraw on any drawing modification, optimize.
			this.createPreviews_();
			this.redrawFlag = false;
		}
    };

    ns.PreviewFilmController.prototype.createPreviews_ = function () {
		this.container.html("");

		var frameCount = this.framesheet.getFrameCount();

		for (var i = 0, l = frameCount; i < l ; i++) {
			this.container.append(this.createInterstitialTile_(i));
			this.container.append(this.createPreviewTile_(i));
		}
		this.container.append(this.createInterstitialTile_(frameCount));

		var needDragndropBehavior = !!(frameCount > 1);
		if(needDragndropBehavior) {
			this.initDragndropBehavior_();
		}
    };

    /**
     * @private
     */
    ns.PreviewFilmController.prototype.createInterstitialTile_ = function (tileNumber) {
    	var interstitialTile = document.createElement("div");
		interstitialTile.className = "interstitial-tile"
		interstitialTile.setAttribute("data-tile-type", "interstitial");
		interstitialTile.setAttribute("data-inject-drop-tile-at", tileNumber);

		return interstitialTile;
    };

    /**
     * @private
     */
    ns.PreviewFilmController.prototype.initDragndropBehavior_ = function () {
    	var tiles = $(".preview-tile");
    	// Each preview film tile is draggable.
    	tiles.draggable( {
	      //containment: '.left-nav',
	      stack: '.preview-tile',
	      cursor: 'move',
	      revert: true,
	      start: function(event, ui) {
	      	// We only show the fake interstitial tiles when starting the 
	      	// drag n drop interaction. We hide them when the DnD is done.
	      	$('#preview-list').addClass("show-interstitial-tiles");
	      },
	      stop: function() {
	      	$('#preview-list').removeClass("show-interstitial-tiles");
	      }
	    });


    	// Each preview film tile is a drop target. This allow us to swap two tiles.
    	// However, we want to be able to insert a tile between two other tiles.
    	// For that we created fake interstitial tiles that are used as drop targets as well.
    	var droppableTiles = $(".interstitial-tile");
    	$.merge(droppableTiles, tiles);

	    droppableTiles.droppable( {
	        accept: ".preview-tile",
	        tolerance: "pointer",
			activeClass: "droppable-active",
			hoverClass: "droppable-hover-active",
			drop: $.proxy(this.onDrop_, this)
	    });
    };

    /**
     * @private
     */
    ns.PreviewFilmController.prototype.onDrop_ = function( event, ui ) {
		var activeFrame;
		// When we drag from an element, the drag could start from a nested DOM element
		// inside the drag target. We normalize that by taking the correct ancestor:
		var originTile = $(event.srcElement).closest(".preview-tile");
		var originFrameId = parseInt(originTile.data("tile-number"), 10);

		var dropTarget = $(event.target);
		if(dropTarget.data("tile-type") == "interstitial") {
			var targetInsertionId = parseInt(dropTarget.data("inject-drop-tile-at"), 10);
			// In case we drop outside of the tile container
			if(isNaN(originFrameId) || isNaN(targetInsertionId)) {
				return;
			}
			//console.log("origin-frame: "+originFrameId+" - targetInsertionId: "+ targetInsertionId)
			this.framesheet.moveFrame(originFrameId, targetInsertionId);
			
			activeFrame = targetInsertionId;
			// The last fake interstitial tile is outside of the framesheet array bound.
			// It allow us to append after the very last element in this fake slot.
			// However, when setting back the active frame, we have to make sure the 
			// frame does exist.
			if(activeFrame > (this.framesheet.getFrameCount() - 1)) {
				activeFrame = targetInsertionId - 1;
			}
		} else {
			var targetSwapId = parseInt(dropTarget.data("tile-number"), 10);
			// In case we drop outside of the tile container
			if(isNaN(originFrameId) || isNaN(targetSwapId)) {
				return;
			}
			//console.log("origin-frame: "+originFrameId+" - targetSwapId: "+ targetSwapId)
			this.framesheet.swapFrames(originFrameId, targetSwapId);
			activeFrame = targetSwapId;
		}

		
		$('#preview-list').removeClass("show-interstitial-tiles");

		this.framesheet.setCurrentFrameIndex(activeFrame);

		// TODO(vincz): move localstorage request to the model layer?
		$.publish(Events.LOCALSTORAGE_REQUEST);
	};

	/**
     * @private
     * TODO(vincz): clean this giant rendering function & remove listeners.
     */
    ns.PreviewFilmController.prototype.createPreviewTile_ = function(tileNumber) {
    	var currentFrame = this.framesheet.getFrameByIndex(tileNumber);
    	
		var previewTileRoot = document.createElement("li");
		var classname = "preview-tile";
		previewTileRoot.setAttribute("data-tile-number", tileNumber);

		if (this.framesheet.getCurrentFrame() == currentFrame) {
			classname += " selected";
		}
		previewTileRoot.className = classname;

		var canvasContainer = document.createElement("div");
		canvasContainer.className = "canvas-container";
		
		var canvasBackground = document.createElement("div");
		canvasBackground.className = "canvas-background";
		canvasContainer.appendChild(canvasBackground);
		
		previewTileRoot.addEventListener('click', this.onPreviewClick_.bind(this, tileNumber));

		var canvasPreviewDuplicateAction = document.createElement("button");
		canvasPreviewDuplicateAction.className = "tile-action"
		canvasPreviewDuplicateAction.innerHTML = "dup"

		canvasPreviewDuplicateAction.addEventListener('click', this.onAddButtonClick_.bind(this, tileNumber));

		// TODO(vincz): Eventually optimize this part by not recreating a FrameRenderer. Note that the real optim
		// is to make this update function (#createPreviewTile) less aggressive.
		var renderingOptions = {"dpi": this.dpi };
		var currentFrameRenderer = new pskl.rendering.FrameRenderer($(canvasContainer), renderingOptions, "tile-view");
		currentFrameRenderer.init(currentFrame);
		
		previewTileRoot.appendChild(canvasContainer);
		previewTileRoot.appendChild(canvasPreviewDuplicateAction);

		if(tileNumber > 0 || this.framesheet.getFrameCount() > 1) {
			var canvasPreviewDeleteAction = document.createElement("button");
			canvasPreviewDeleteAction.className = "tile-action"
			canvasPreviewDeleteAction.innerHTML = "del"
			canvasPreviewDeleteAction.addEventListener('click', this.onDeleteButtonClick_.bind(this, tileNumber));
			previewTileRoot.appendChild(canvasPreviewDeleteAction);
		}

		return previewTileRoot;
    };

    ns.PreviewFilmController.prototype.onPreviewClick_ = function (index, evt) {
    	// has not class tile-action:
		if(!evt.target.classList.contains('tile-action')) {
			this.framesheet.setCurrentFrameIndex(index);
		}    
    };

    ns.PreviewFilmController.prototype.onDeleteButtonClick_ = function (index, evt) {
    	this.framesheet.removeFrameByIndex(index);
		$.publish(Events.FRAMESHEET_RESET);
		$.publish(Events.LOCALSTORAGE_REQUEST);	// Should come from model	
    };

    ns.PreviewFilmController.prototype.onAddButtonClick_ = function (index, evt) {
    	this.framesheet.duplicateFrameByIndex(index);
		$.publish(Events.LOCALSTORAGE_REQUEST);	 // Should come from model
		this.framesheet.setCurrentFrameIndex(index + 1);
    };
})();