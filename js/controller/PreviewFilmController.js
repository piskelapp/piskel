(function () {
	var ns = $.namespace("pskl.controller");
	ns.PreviewFilmController = function (framesheet, container, dpi) {

		this.dpi = dpi;
		this.framesheet = framesheet;
		this.container = container;

		//this.renderer = new pskl.rendering.FrameRenderer(this.container, dpi);
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
      this.container.innerHTML = "";
      for (var i = 0, l = this.framesheet.getFrameCount(); i < l ; i++) {
        this.container.appendChild(this.createPreviewTile(i));
      }
    };

    ns.PreviewFilmController.prototype.createPreviewTile = function(tileNumber) {
    	var currentFrame = this.framesheet.getFrameByIndex(tileNumber);
    	//var width = frame.getWidth() * this.dpi,
    	//	height = frame.getHeight() * this.dpi;

		var previewTileRoot = document.createElement("li");
		var classname = "preview-tile";

		if (piskel.getActiveFrameIndex() == tileNumber) {
			classname += " selected";
		}
		previewTileRoot.className = classname;

		var canvasContainer = document.createElement("div");
		canvasContainer.className = "canvas-container";
		//canvasContainer.setAttribute('style', 'width:' + width + 'px; height:' + height + 'px;');

		var canvasBackground = document.createElement("div");
		canvasBackground.className = "canvas-background";
		canvasContainer.appendChild(canvasBackground);
		/*
		var canvasPreview = document.createElement("canvas");
		canvasPreview.className = "canvas tile-view"

		canvasPreview.setAttribute('width', width);
		canvasPreview.setAttribute('height', height);     
        */
		
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

		//this.renderer.render(this.framesheet.getFrameByIndex(tileNumber), canvasPreview);
		
		// TODO(vincz): Eventually optimize this part by not recreating a FrameRenderer. Note that the real optim
		// is to make this update function (#createPreviewTile) less aggressive.
		var currentFrameRenderer = new pskl.rendering.FrameRenderer(canvasContainer, this.dpi, "tile-view");
		currentFrameRenderer.init(currentFrame);
		
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