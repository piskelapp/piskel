(function () {
    var ns = $.namespace("pskl.controller");
    ns.AnimatedPreviewController = function (framesheet, container, dpi) {
        this.framesheet = framesheet;
        this.container = container;

        this.elapsedTime = 0;
        this.currentIndex = 0;

        this.fps = parseInt($("#preview-fps")[0].value, 10);
        
        var renderingOptions = {
            "dpi": this.calculateDPI_()
        };
        this.renderer = new pskl.rendering.FrameRenderer(this.container, renderingOptions);

        $.subscribe(Events.FRAME_SIZE_CHANGED, this.updateDPI_.bind(this));
    };

    ns.AnimatedPreviewController.prototype.init = function () {
        // the oninput event won't work on IE10 unfortunately, but at least will provide a
        // consistent behavior across all other browsers that support the input type range
        // see https://bugzilla.mozilla.org/show_bug.cgi?id=853670
        $("#preview-fps")[0].addEventListener('change', this.onFPSSliderChange.bind(this));
    };

    ns.AnimatedPreviewController.prototype.onFPSSliderChange = function (evt) {
        this.setFPS(parseInt($("#preview-fps")[0].value, 10));
    };

    ns.AnimatedPreviewController.prototype.setFPS = function (fps) {
        this.fps = fps;
        $("#preview-fps").val(this.fps);
        $("#display-fps").html(this.fps + " FPS");
    };

    ns.AnimatedPreviewController.prototype.render = function (delta) {
        this.elapsedTime += delta;
        var index = Math.floor(this.elapsedTime / (1000/this.fps));
        if (index != this.currentIndex) {
            this.currentIndex = index;
            if (!this.framesheet.hasFrameAtIndex(this.currentIndex)) {
                this.currentIndex = 0;
                this.elapsedTime = 0;
            }
            this.renderer.render(this.framesheet.getFrameByIndex(this.currentIndex));
        }
    };

    /**
     * Calculate the preview DPI depending on the framesheet size
     */
    ns.AnimatedPreviewController.prototype.calculateDPI_ = function () {
        var previewSize = 200,
            framePixelHeight = this.framesheet.getCurrentFrame().getHeight(),
            framePixelWidth = this.framesheet.getCurrentFrame().getWidth();
        // TODO (julz) : should have a utility to get a Size from framesheet easily (what about empty framesheets though ?)
        
        //return pskl.PixelUtils.calculateDPIForContainer($(".preview-container"), framePixelHeight, framePixelWidth);
        return pskl.PixelUtils.calculateDPI(previewSize, previewSize, framePixelHeight, framePixelWidth);
    };

    ns.AnimatedPreviewController.prototype.updateDPI_ = function () {
        this.dpi = this.calculateDPI_();
        this.renderer.updateDPI(this.dpi);
    };
})();