(function () {
    var ns = $.namespace("pskl.controller");
    ns.PreviewFilmController = function (framesheet, container, dpi) {

        this.framesheet = framesheet;
        this.container = container;
        this.dpi = this.calculateDPI_();

        this.redrawFlag = true;

        $.subscribe(Events.TOOL_RELEASED, this.flagForRedraw_.bind(this));
        $.subscribe(Events.FRAMESHEET_RESET, this.flagForRedraw_.bind(this));
        $.subscribe(Events.FRAMESHEET_RESET, this.refreshDPI_.bind(this));
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

    ns.PreviewFilmController.prototype.createPreviews_ = function () {
        
        this.container.html("");
        // Manually remove tooltips since mouseout events were shortcut by the DOM refresh:
        $(".tooltip").remove();

        var frameCount = this.framesheet.getFrameCount();

        for (var i = 0, l = frameCount; i < l ; i++) {
            this.container.append(this.createPreviewTile_(i));
        }
        
        var needDragndropBehavior = (frameCount > 1);
        if(needDragndropBehavior) {
            this.initDragndropBehavior_();
        }
    };


    /**
     * @private
     */
    ns.PreviewFilmController.prototype.initDragndropBehavior_ = function () {
        
        $( "#preview-list" ).sortable({
          placeholder: "preview-tile-drop-proxy",
          update: $.proxy(this.onUpdate_, this)
        });
        $( "#preview-list" ).disableSelection();
    };

    /**
     * @private
     */
    ns.PreviewFilmController.prototype.onUpdate_ = function( event, ui ) {
        var originFrameId = parseInt(ui.item.data("tile-number"), 10);
        var targetInsertionId = $('.preview-tile').index(ui.item);

        this.framesheet.moveFrame(originFrameId, targetInsertionId);
        this.framesheet.setCurrentFrameIndex(targetInsertionId);

        // TODO(grosbouddha): move localstorage request to the model layer?
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
        var currentFrameRenderer = new pskl.rendering.FrameRenderer($(canvasContainer), renderingOptions, "tile-view");
        currentFrameRenderer.init(currentFrame);
        
        previewTileRoot.appendChild(canvasContainer);

        if(tileNumber > 0 || this.framesheet.getFrameCount() > 1) {
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
            this.framesheet.setCurrentFrameIndex(index);
        }    
    };

    ns.PreviewFilmController.prototype.onDeleteButtonClick_ = function (index, evt) {
        this.framesheet.removeFrameByIndex(index);
        $.publish(Events.LOCALSTORAGE_REQUEST); // Should come from model   
    };

    ns.PreviewFilmController.prototype.onAddButtonClick_ = function (index, evt) {
        this.framesheet.duplicateFrameByIndex(index);
        $.publish(Events.LOCALSTORAGE_REQUEST);  // Should come from model
        this.framesheet.setCurrentFrameIndex(index + 1);
    };

    /**
     * Calculate the preview DPI depending on the framesheet size
     */
    ns.PreviewFilmController.prototype.calculateDPI_ = function () {
        var previewSize = 120,
            framePixelHeight = this.framesheet.getCurrentFrame().getHeight(),
            framePixelWidth = this.framesheet.getCurrentFrame().getWidth();
        // TODO (julz) : should have a utility to get a Size from framesheet easily (what about empty framesheets though ?)

        return pskl.PixelUtils.calculateDPI(previewSize, previewSize, framePixelHeight, framePixelWidth);
    };
})();