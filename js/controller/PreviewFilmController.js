(function () {
	var ns = $.namespace("pskl.controller");
	ns.PreviewFilmController = function (framesheet, container, dpi) {

		this.dpi = dpi;
		this.framesheet = framesheet;
		this.container = container;

		this.renderer = new pskl.rendering.FrameRenderer();
	};

	ns.PreviewFilmController.prototype.init = function() {
      var addFrameButton = $('#add-frame-button')[0];
      addFrameButton.addEventListener('mousedown', this.addFrame.bind(this));
      this.createPreviews();
    };

    ns.PreviewFilmController.prototype.addFrame = function () {
 		this.framesheet.addEmptyFrame();
        piskel.setActiveFrameAndRedraw(this.framesheet.getFrameCount() - 1);
    };

    ns.PreviewFilmController.prototype.createPreviews = function () {
      this.container.html("");
      for (var i = 0, l = this.framesheet.getFrameCount(); i < l ; i++) {
        this.container.append(this.createPreviewTile(i));
      }
      this.initTilesBehavior();
    };

    ns.PreviewFilmController.prototype.initTilesBehavior = function () {
    	var tiles = $(".preview-tile");
    	tiles.draggable( {
	      containment: '#preview-list',
	      stack: '.preview-tile',
	      cursor: 'move',
	      revert: true
	    });

	    tiles.droppable( {
	        accept: ".preview-tile",
			activeClass: "droppable-active",
			hoverClass: "droppable-hover-active",
			drop: $.proxy(this.onDrop_, this)
	    });
    };

    /**
     * @private
     */
    ns.PreviewFilmController.prototype.onDrop_ = function( event, ui ) {
		var frameId1 = parseInt($(event.srcElement).data("tile-number"), 10);
		var frameId2 = parseInt($(event.target).data("tile-number"), 10);

		this.framesheet.swapFrames(frameId1, frameId2);

		// TODO(vincz): deprecate
		piskel.setActiveFrameAndRedraw(frameId2);

		// TODO(vincz): move localstorage request to the model layer?
		$.publish(Events.LOCALSTORAGE_REQUEST);
	};

    ns.PreviewFilmController.prototype.createPreviewTile = function(tileNumber) {
    	var frame = this.framesheet.getFrameByIndex(tileNumber);
    	var width = frame.getWidth() * this.dpi,
    		height = frame.getHeight() * this.dpi;

		var previewTileRoot = document.createElement("li");
		var classname = "preview-tile";
		previewTileRoot.setAttribute("data-tile-number", tileNumber);

		if (piskel.getActiveFrameIndex() == tileNumber) {
			classname += " selected";
		}
		previewTileRoot.className = classname;

		var canvasContainer = document.createElement("div");
		canvasContainer.className = "canvas-container";
		canvasContainer.setAttribute('style', 'width:' + width + 'px; height:' + height + 'px;');

		var canvasBackground = document.createElement("div");
		canvasBackground.className = "canvas-background";
		canvasContainer.appendChild(canvasBackground);

		var canvasPreview = document.createElement("canvas");
		canvasPreview.className = "canvas tile-view"

		canvasPreview.setAttribute('width', width);
		canvasPreview.setAttribute('height', height);     

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

		this.renderer.render(this.framesheet.getFrameByIndex(tileNumber), canvasPreview, this.dpi);
		canvasContainer.appendChild(canvasPreview);
		previewTileRoot.appendChild(canvasContainer);
		previewTileRoot.appendChild(canvasPreviewDuplicateAction);

		if(tileNumber > 0 || this.framesheet.getFrameCount() > 1) {
			var canvasPreviewDeleteAction = document.createElement("button");
			canvasPreviewDeleteAction.className = "tile-action"
			canvasPreviewDeleteAction.innerHTML = "del"
			canvasPreviewDeleteAction.addEventListener('click', function(evt) {
				piskel.removeFrame(tileNumber);
			});
			previewTileRoot.appendChild(canvasPreviewDeleteAction);
		}

		return previewTileRoot;
    };
})();