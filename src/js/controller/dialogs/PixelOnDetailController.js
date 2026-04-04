(function () {
    var ns = $.namespace('pskl.controller.dialogs');

    ns.PixelOnDetailController = function (piskelController, args) {
        this.piskelController = piskelController;
        this.pixelOnController = pskl.app.pixelOnController;
        this.sdController = pskl.app.sdController;
        this.args = args;
        this.callbackId = 'pixel-on-detail';
    };
    pskl.utils.inherit(ns.PixelOnDetailController, pskl.controller.dialogs.AbstractDialogController);

    ns.PixelOnDetailController.prototype.init = function () {
        this.container = document.querySelector('[data-dialog-id="pixel-on-detail"]');
        this.isGenerating = false;

        // History Column
        this.historyListEl = this.container.querySelector('.history-list');
        this.createSessionButton = this.container.querySelector('#new-session');

        // Prompt Column
        this.positivePromptContainer = this.container.querySelector('.positive-prompt-container');
        this.positivePromptInput = this.positivePromptContainer.querySelector('.tag-input');
        this.negativePromptContainer = this.container.querySelector('.negative-prompt-container');
        this.negativePromptInput = this.negativePromptContainer.querySelector('.tag-input');
        this.widthInputEl = this.container.querySelector('.resolution-input[data-param="width"]');
        this.resolutionShortcuts = this.container.querySelector('.resolution-shortcuts');
        this.countInputEl = this.container.querySelector('.count-input');
        this.colorsInputEl = this.container.querySelector('.colors-input');
        this.seedInputEl = this.container.querySelector('.seed-input');
        this.colorWarningTextEl = this.container.querySelector('.color-warning-text');
        this.generateButton = this.container.querySelector('.generate-button');
        this.presetStatusEl = this.container.querySelector('.preset-status');
        this.presetButtonsContainer = this.container.querySelector('.preset-buttons');
        this.presetButtons = this.container.querySelectorAll('.preset-button');

        // Toggleable Settings
        this.colorSeedToggle = this.container.querySelector('#color-seed-settings');
        this.colorSeedArrow = this.colorSeedToggle.querySelector('.toggle-arrow');
        this.colorSeedSummary = this.colorSeedToggle.querySelector('.toggle-summary');
        this.colorSeedContent = this.colorSeedToggle.querySelector('.toggle-content');

        // Result Column
        this.resultsContainerEl = this.container.querySelector('.result-container');
        this.statusTextEl = this.container.querySelector('.status-text');
        this.btnMoveToFrame = this.container.querySelector('.move-to-frame-button');
        this.btnMoveToLayer = this.container.querySelector('.move-to-layer-button');
        this.selectControlsEl = this.container.querySelector('.select-controls');
        this.selectedCountEl = this.container.querySelector('.selected-count');
        this.cancelSelectButton = this.container.querySelector('.cancel-select-button');
        this.deleteSelectButton = this.container.querySelector('.delete-select-button');

        // Misc
        this.sizeWarningEl = this.createSizeWarningElement_();
        this.historyBlockTemplate_ = pskl.utils.Template.get('history-block-template');
        this.imageFrameTemplate_ = pskl.utils.Template.get('image-frame-template');
        this.dialogWrapper = this.container.parentNode.parentNode;

        // Register callbacks
        this.sdController.registerCallbacks(this.callbackId, {
            onProgress: this.updateUiForGenerationState_.bind(this),
            onImage: this.onImageReceive_.bind(this),
            onDone: this.onGenerationDone_.bind(this),
            onError: this.onGenerationError_.bind(this)
        });

        // Add event listeners
        this.addEventListener(this.colorSeedToggle.querySelector('.toggle-header'), 'click', this.onToggleColorSeedClick_.bind(this));
        this.addEventListener(this.colorsInputEl, 'input', this.updateColorSeedSummary_.bind(this));
        this.addEventListener(this.seedInputEl, 'input', this.updateColorSeedSummary_.bind(this));
        this.addEventListener(this.dialogWrapper, 'click', this.onCloseFuncs_, true);
        this.addEventListener(this.createSessionButton, 'click', this.onNewSessionClick_);
        this.addEventListener(this.generateButton, 'click', this.onGenerateClick_);
        this.addEventListener(this.presetButtonsContainer, 'click', this.onPresetButtonClick_.bind(this));
        this.addEventListener(this.cancelSelectButton, 'click', this.onCancelSelectClick_.bind(this));
        this.addEventListener(this.deleteSelectButton, 'click', this.onDeleteSelectClick_.bind(this));
        var closeButton = this.container.querySelector('.dialog-close');
        this.addEventListener(closeButton, 'click', this.onCloseClick_);
        var cancelButton = this.container.querySelector('.cancel-button');
        this.addEventListener(cancelButton, 'click', this.onCloseClick_);
        this.addEventListener(this.historyListEl, 'click', this.onHistoryItemClick_.bind(this));
        this.addEventListener(this.resultsContainerEl, 'click', this.onResultsContentClick_.bind(this));
        this.addEventListener(document, 'click', this.onDocumentClick_.bind(this));
        this.addEventListener(this.btnMoveToFrame, 'click', this.onMoveToFrame_.bind(this));
        this.addEventListener(this.btnMoveToLayer, 'click', this.onMoveToLayer_.bind(this));
        this.addEventListener(this.positivePromptInput, 'keydown', this.onTagInputKeyDown_.bind(this, this.positivePromptContainer));
        this.addEventListener(this.negativePromptInput, 'keydown', this.onTagInputKeyDown_.bind(this, this.negativePromptContainer));
        this.addEventListener(this.positivePromptContainer, 'click', this.onTagContainerClick_.bind(this));
        this.addEventListener(this.negativePromptContainer, 'click', this.onTagContainerClick_.bind(this));
        this.addEventListener(this.resolutionShortcuts, 'click', this.onResolutionShortcutClick_.bind(this));
        this.addEventListener(this.colorsInputEl, 'input', this.updateColorCountValidation_.bind(this));

        this.currentSession = null;
        this.onNewSessionClick_();
        this.btnMoveToFrame.disabled = true;
        this.btnMoveToLayer.disabled = true;
    };

    // =================================================================
    //                         UI Initialization
    // =================================================================
    ns.PixelOnDetailController.prototype.initHistoryList_ = function() {
        const new_session = this.historyListEl.firstElementChild;
        this.historyListEl.innerHTML = '';
        this.historyListEl.appendChild(new_session);

        const sessions = this.pixelOnController.getSessions();
        if (sessions.length > 0) {
            sessions.forEach((session) => {
                const tmp = this.createHistoryBlock_(session);
                tmp.classList.remove('selected');
            })
        }
    };

    ns.PixelOnDetailController.prototype.initResult_ = function(imageList) {
        this.resultsContainerEl.innerHTML = '';
        imageList.forEach((uuid) => {
            this.createImageFrame_(uuid, this.pixelOnController.getImage(uuid));
        });
    };

    ns.PixelOnDetailController.prototype.initDefault_ = function(spec) {
        const pixelOn = this.pixelOnController;
        if (!spec) {
            spec = {
                p_prompt: "",
                n_prompt: "",
                width: pixelOn.getWidth(),
                height: pixelOn.getHeight(),
                count: pixelOn.getGenerateCount(),
                color_qunt: 48,
                seed: -1,
                preset: "general"
            }
        }

        this.clearTags_(this.positivePromptContainer);
        spec.p_prompt.split(',').forEach(tag => {
            if (tag.trim()) this.addTag_(this.positivePromptContainer, tag.trim());
        });

        this.clearTags_(this.negativePromptContainer);
        spec.n_prompt.split(',').forEach(tag => {
            if (tag.trim()) this.addTag_(this.negativePromptContainer, tag.trim());
        });

        this.widthInputEl.value = spec.width;
        this.countInputEl.value = spec.count;
        this.colorsInputEl.value = spec.color_qunt || 48;
        this.seedInputEl.value = spec.seed || -1;
        this.updateSelectControls_();
        
        this.presetButtons.forEach(function(button) {
            button.classList.remove('active');
            if (button.dataset.preset.toLowerCase() === (spec.preset || "general").toLowerCase()) {
                button.classList.add('active');
            }
        });
        this.updatePresetStatus_();
        this.updateColorCountValidation_();
        this.updateColorSeedSummary_();
    };

    ns.PixelOnDetailController.prototype.getSpec_ = function() {
        const p_prompt = this.getTagsAsString_(this.positivePromptContainer);
        const n_prompt = this.getTagsAsString_(this.negativePromptContainer);
        const width = parseInt(this.widthInputEl.value, 10);
        const height = parseInt(this.widthInputEl.value, 10);
        const count = parseInt(this.countInputEl.value, 10);
        const color_qunt = parseInt(this.colorsInputEl.value, 10);
        const seed = parseInt(this.seedInputEl.value, 10);
        const activeButton = this.presetButtonsContainer.querySelector('.preset-button.active');
        const preset = activeButton ? activeButton.dataset.preset : 'general';

        return { p_prompt, n_prompt, width, height, count, color_qunt, seed, preset };
    }

    ns.PixelOnDetailController.prototype.createHistoryBlock_ = function(session) {
        var historyBlockItem = pskl.utils.Template.replace(this.historyBlockTemplate_, {
            'historyName': session.getName(),
            'uuid': session.getUuid()
        });
        var historyBlock = pskl.utils.Template.createFromHTML(historyBlockItem);
        const next = this.historyListEl.firstElementChild.nextElementSibling;
        this.historyListEl.insertBefore(historyBlock, next);

        var allItems = this.historyListEl.querySelectorAll('.history-block');
        allItems.forEach(function(item) {
            item.classList.remove('selected');
        });
        historyBlock.classList.add('selected');
        return historyBlock;
    }

    ns.PixelOnDetailController.prototype.createImageFrame_ = function(uuid, data) {
        const imageFrameItme = pskl.utils.Template.replace(this.imageFrameTemplate_, {
            "uuid": uuid,
            "img": data.image,
        })
        const imageFrame = pskl.utils.Template.createFromHTML(imageFrameItme);
        this.resultsContainerEl.appendChild(imageFrame);
    }

    ns.PixelOnDetailController.prototype.updateUiForGenerationState_ = function(isGenerating, statusMessage) {
        this.isGenerating = isGenerating;
        if (isGenerating) {
            this.generateButton.textContent = 'Stop';
            this.generateButton.classList.add('stop-button');
            this.statusTextEl.textContent = statusMessage || 'Generating...';
        } else {
            this.generateButton.textContent = 'Generate';
            this.generateButton.classList.remove('stop-button');
            this.statusTextEl.textContent = statusMessage || 'Ready';
        }
    };

    // =================================================================
    //                          Event Handlers
    // =================================================================
    ns.PixelOnDetailController.prototype.onResolutionShortcutClick_ = function (evt) {
        var size = evt.target.dataset.size;
        if (size) {
            this.widthInputEl.value = size;
        }
    };

    ns.PixelOnDetailController.prototype.onToggleColorSeedClick_ = function () {
        const group = this.colorSeedToggle;
        const isExpanded = group.classList.toggle('is-expanded');
        this.colorSeedArrow.textContent = isExpanded ? '▼' : '▶';
        this.colorSeedContent.style.display = isExpanded ? 'flex' : 'none';
        this.colorSeedSummary.style.display = isExpanded ? 'none' : 'inline';
    };

    ns.PixelOnDetailController.prototype.updateColorSeedSummary_ = function () {
        const colorsValue = this.colorsInputEl.value;
        const colorsText = (colorsValue <= 0) ? 'auto' : colorsValue;
        const seedValue = this.seedInputEl.value;
        const seedText = (seedValue == -1) ? 'auto' : seedValue;
        this.colorSeedSummary.textContent = `Color: ${colorsText}   Seed: ${seedText}`;
    };

    ns.PixelOnDetailController.prototype.onPresetButtonClick_ = function (evt) {
        var clickedButton = evt.target.closest('.preset-button');
        if (!clickedButton) return;

        this.presetButtons.forEach(function (button) {
            button.classList.remove('active');
        });

        clickedButton.classList.add('active');
        this.updatePresetStatus_();
    };

    ns.PixelOnDetailController.prototype.updatePresetStatus_ = function() {
        var activeButton = this.presetButtonsContainer.querySelector('.preset-button.active');
        this.presetStatusEl.textContent = activeButton ? activeButton.textContent : 'None';
    };

    ns.PixelOnDetailController.prototype.onNewSessionClick_ = function (evt) {
        this.currentSession = null;
        this.initHistoryList_();
        this.initDefault_(null);
        this.initResult_([]);
    };

    ns.PixelOnDetailController.prototype.onHistoryItemClick_ = function (evt) {
        var target = evt.target;

        if (target.classList.contains('history-item-menu-button')) {
            this.toggleHistoryItemMenu_(target);
            return;
        }

        if (target.classList.contains('history-item-action-rename')) {
            this.enableRenameMode_(target.closest('.history-block'));
            this.closeAllHistoryItemMenus_();
            return;
        }

        if (target.classList.contains('history-item-action-delete')) {
            var historyItem = target.closest('.history-block');
            if (historyItem) {
                this.pixelOnController.removeSessionByUuid(historyItem.getAttribute("uuid"));
                historyItem.remove();
            }
            this.closeAllHistoryItemMenus_();
            return;
        }

        var historyItem = target.closest('.history-block');
        if (historyItem && !historyItem.querySelector('input')) {
            var allItems = this.historyListEl.querySelectorAll('.history-block');
            allItems.forEach(item => item.classList.remove('selected'));
            historyItem.classList.add('selected');

            const targetUuid = historyItem.getAttribute("uuid");
            if (this.currentSession?.getUuid() !== targetUuid) {
                const currentSession = this.pixelOnController.getSessionByUuid(targetUuid);
                this.initDefault_(currentSession.getSpec());
                this.initResult_(currentSession.getImageUuidsList());
                this.currentSession = currentSession;
            }
        }
    };

    ns.PixelOnDetailController.prototype.toggleHistoryItemMenu_ = function (button) {
        var menu = button.nextElementSibling;
        var isVisible = menu.style.display === 'block';
        this.closeAllHistoryItemMenus_();
        if (!isVisible) {
            menu.style.display = 'block';
        }
    };

    ns.PixelOnDetailController.prototype.closeAllHistoryItemMenus_ = function () {
        this.historyListEl.querySelectorAll('.history-item-menu').forEach(menu => menu.style.display = 'none');
    };

    ns.PixelOnDetailController.prototype.enableRenameMode_ = function (historyItem) {
        var nameSpan = historyItem.querySelector('.history-item-name');
        var currentName = nameSpan.textContent;
        var input = document.createElement('input');
        input.type = 'text';
        input.className = 'history-item-name-input';
        input.value = currentName;

        nameSpan.style.display = 'none';
        nameSpan.parentNode.insertBefore(input, nameSpan.nextSibling);
        input.focus();
        input.select();

        var disableRename = this.disableRenameMode_.bind(this, input, nameSpan);
        input.addEventListener('blur', disableRename);
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') disableRename();
            else if (e.key === 'Escape') {
                input.value = currentName;
                disableRename();
            }
        });
    };

    ns.PixelOnDetailController.prototype.disableRenameMode_ = function (input, nameSpan) {
        var newName = input.value.trim();
        if (newName) {
            nameSpan.textContent = newName;
            const uuid = input.parentElement?.getAttribute("uuid");
            this.pixelOnController.renameSession(uuid, newName);
        }
        nameSpan.style.display = '';
        if (input.parentElement) {
            input.parentElement.removeChild(input);
        }
    };

    ns.PixelOnDetailController.prototype.onDocumentClick_ = function (evt) {
        if (!evt.target.closest('.history-item-actions')) {
            this.closeAllHistoryItemMenus_();
        }
        if (!evt.target.closest('.image-frame')) {
            this.closeAllImageActions_();
        }
        if (!evt.target.closest('.tag-input-container')) {
            var tagToDelete = this.container.querySelector('.tag-to-delete');
            if (tagToDelete) {
                tagToDelete.classList.remove('tag-to-delete');
            }
        }
    };

    ns.PixelOnDetailController.prototype.onGenerateClick_ = function () {
        if (this.isGenerating) {
            this.stopGeneration_();
        } else {
            var pText = this.positivePromptInput.value.trim();
            if (pText) {
                pText.split(',').forEach(tag => {
                    if (tag.trim()) this.addTag_(this.positivePromptContainer, tag.trim());
                });
                this.positivePromptInput.value = '';
            }

            var nText = this.negativePromptInput.value.trim();
            if (nText) {
                nText.split(',').forEach(tag => {
                    if (tag.trim()) this.addTag_(this.negativePromptContainer, tag.trim());
                });
                this.negativePromptInput.value = '';
            }

            this.startGeneration_();
        }
    };

    ns.PixelOnDetailController.prototype.startGeneration_ = function () {
        const spec = this.getSpec_();
        let currentSession = this.currentSession;
        if (!currentSession) {
            currentSession = new pskl.model.pixelOn.AiSession(spec.p_prompt, spec);
            this.pixelOnController.addSession(currentSession);
            this.createHistoryBlock_(currentSession);
            this.currentSession = currentSession;
        } else {
            currentSession.setSpec(spec);
        }
        this.sdController.generate(spec, currentSession.getUuid());
    };

    ns.PixelOnDetailController.prototype.stopGeneration_ = function () {
        if (this.currentSession) {
            this.sdController.stop(this.currentSession.getUuid());
        }
    };

    ns.PixelOnDetailController.prototype.updateColorCountValidation_ = function() {
        const colors = parseInt(this.colorsInputEl.value, 10);
        const isInvalid = colors > 0 && (colors < 8 || colors > 48);

        if (isInvalid) {
            this.colorsInputEl.classList.add('invalid');
            this.colorWarningTextEl.style.display = 'inline';
        } else {
            this.colorsInputEl.classList.remove('invalid');
            this.colorWarningTextEl.style.display = 'none';
        }
    };

    // =================================================================
    //                         SDController Callbacks
    // =================================================================
    ns.PixelOnDetailController.prototype.onImageReceive_ = function(data) {
        const session = this.pixelOnController.getSessionByUuid(data.session_id);
        if (!session) return;
        if (this.currentSession && session.getUuid() === this.currentSession.getUuid()) {
            this.createImageFrame_(data.imgUuid, this.pixelOnController.getImage(data.imgUuid));
        }
    };

    ns.PixelOnDetailController.prototype.onGenerationDone_ = function(data) {
        console.log('Generation finished:', data.status);
    };

    ns.PixelOnDetailController.prototype.onGenerationError_ = function(errorMessage) {
        console.error("Generation Error reported to Dialog:", errorMessage);
    };

    // =================================================================
    //                         Result Image Handlers
    // =================================================================
    ns.PixelOnDetailController.prototype.onResultsContentClick_ = function (evt) {
        var target = evt.target;
        var imageFrame = target.closest('.image-frame');

        if (target.classList.contains('image-menu-button')) {
            this.toggleImageActions_(imageFrame);
            return;
        }

        if (target.classList.contains('image-action-delete')) {
            if (imageFrame) {
                imageFrame.remove();
                this.currentSession.removeImageUuid(imageFrame.getAttribute("uuid"));
                this.updateSelectControls_();
            }
            this.closeAllImageActions_();
            return;
        }

        if (target.classList.contains('image-action-transfer-prompt')) {
            if (imageFrame) {
                this.initDefault_(this.pixelOnController.getImage(imageFrame.getAttribute("uuid")).spec);
            }
            this.closeAllImageActions_();
            return;
        }

        if (imageFrame && !target.closest('.image-overlay-actions')) {
            imageFrame.classList.toggle('selected');
            this.updateSelectControls_();
        }
    };

    ns.PixelOnDetailController.prototype.updateSelectControls_ = function () {
        var selectedFrames = this.resultsContainerEl.querySelectorAll('.image-frame.selected');
        var count = selectedFrames.length;
        var buttons = [this.btnMoveToFrame, this.btnMoveToLayer];

        if (count > 0) {
            this.selectedCountEl.textContent = count + ' selected';
            this.selectControlsEl.style.display = 'flex';
            this.btnMoveToFrame.disabled = false;
            this.btnMoveToLayer.disabled = false;

            var isOversizedSelected = false;
            var targetWidth = this.piskelController.getWidth();
            var targetHeight = this.piskelController.getHeight();

            for (var i = 0; i < selectedFrames.length; i++) {
                var frame = selectedFrames[i];
                var imgElement = frame.querySelector('.image-dimensions-source');
                if (imgElement && (imgElement.naturalWidth > targetWidth || imgElement.naturalHeight > targetHeight)) {
                    isOversizedSelected = true;
                    break;
                }
            }

            var warningMessage = this.sizeWarningEl.textContent;
            buttons.forEach(function(button) {
                if (isOversizedSelected) {
                    button.setAttribute('rel', 'tooltip');
                    button.setAttribute('data-placement', 'top');
                    button.setAttribute('title', warningMessage);
                    $(button).tooltip('fixTitle');
                } else if (button.hasAttribute('rel')) {
                    $(button).tooltip('hide');
                    button.removeAttribute('rel');
                    button.removeAttribute('title');
                    button.removeAttribute('data-placement');
                }
            });
        } else {
            this.selectControlsEl.style.display = 'none';
            this.btnMoveToFrame.disabled = true;
            this.btnMoveToLayer.disabled = true;
            buttons.forEach(function(button) {
                if (button.hasAttribute('rel')) {
                    $(button).tooltip('hide');
                    button.removeAttribute('rel');
                    button.removeAttribute('title');
                    button.removeAttribute('data-placement');
                }
            });
        }
    };

    ns.PixelOnDetailController.prototype.onCancelSelectClick_ = function () {
        this.resultsContainerEl.querySelectorAll('.image-frame.selected').forEach(frame => frame.classList.remove('selected'));
        this.updateSelectControls_();
    };

    ns.PixelOnDetailController.prototype.onDeleteSelectClick_ = function () {
        this.resultsContainerEl.querySelectorAll('.image-frame.selected').forEach(frame => {
            this.currentSession.removeImageUuid(frame.getAttribute("uuid"));
            frame.remove();
        });
        this.updateSelectControls_();
    };

    ns.PixelOnDetailController.prototype.toggleImageActions_ = function (imageFrame) {
        var isOpen = imageFrame.classList.contains('actions-open');
        this.closeAllImageActions_();
        if (!isOpen) {
            imageFrame.classList.add('actions-open');
        }
    };

    ns.PixelOnDetailController.prototype.closeAllImageActions_ = function () {
        this.resultsContainerEl.querySelectorAll('.image-frame').forEach(frame => frame.classList.remove('actions-open'));
    };

    ns.PixelOnDetailController.prototype.onCloseClick_ = function () {
        this.sdController.unregisterCallbacks(this.callbackId);
        this.closeDialog();
    }

    ns.PixelOnDetailController.prototype.onCloseFuncs_ = function(evt) {
        if (evt.target === this.dialogWrapper) {}
    }

    ns.PixelOnDetailController.prototype.onMoveToFrame_ = function(evt) {
        const selectedFrames = this.resultsContainerEl.querySelectorAll('.image-frame.selected');
        if (selectedFrames.length > 0) {
            const promises = Array.from(selectedFrames).map(element => {
                return new Promise(resolve => {
                    const uuid = element.getAttribute("uuid");
                    const img = this.pixelOnController.getImage(uuid).image;
                    pskl.utils.FrameUtils.createFromImageSrc(img, false, frame => {
                        this.createImageCallback_(frame);
                        resolve();
                    });
                });
            });
            Promise.all(promises).then(() => {
                $.publish(Events.PISKEL_SAVE_STATE, { type: pskl.service.HistoryService.SNAPSHOT });
            });
        }
    }

    ns.PixelOnDetailController.prototype.onMoveToLayer_ = function(evt) {
        const firstSelected = this.resultsContainerEl.querySelector('.image-frame.selected');
        if (firstSelected) {
            const uuid = firstSelected.getAttribute("uuid");
            const img = this.pixelOnController.getImage(uuid).image;
            pskl.utils.FrameUtils.createFromImageSrc(img, false, this.overwriteCurrentFrameCallback_.bind(this));
        }
    }

    // =================================================================
    //                            Tag Management
    // =================================================================
    ns.PixelOnDetailController.prototype.onTagInputKeyDown_ = function (container, event) {
        var input = event.target;
        var tagToDelete = container.querySelector('.tag-to-delete');

        if (event.key === 'Enter') {
            event.preventDefault();
            var text = input.value.trim();
            if (text) {
                this.addTag_(container, text);
                input.value = '';
            }
            if (tagToDelete) {
                tagToDelete.classList.remove('tag-to-delete');
            }
        } else if (event.key === 'Backspace' && input.value === '') {
            if (tagToDelete) {
                var tagText = tagToDelete.firstChild.textContent.trim();
                this.removeTag_(tagToDelete);
                input.value = tagText + ' ';
            } else {
                var lastTag = input.previousElementSibling;
                if (lastTag && lastTag.classList.contains('tag-item')) {
                    lastTag.classList.add('tag-to-delete');
                }
            }
        } else {
            if (tagToDelete) {
                tagToDelete.classList.remove('tag-to-delete');
            }
        }
    };

    ns.PixelOnDetailController.prototype.onTagContainerClick_ = function (event) {
        if (event.target.classList.contains('tag-remove-button')) {
            this.removeTag_(event.target.parentElement);
        } else if (event.target.classList.contains('tag-input-container')) {
            event.target.querySelector('.tag-input').focus();
        }
    };

    ns.PixelOnDetailController.prototype.addTag_ = function (container, text) {
        var tagItem = document.createElement('div');
        tagItem.className = 'tag-item';
        tagItem.textContent = text;
        var removeButton = document.createElement('button');
        removeButton.className = 'tag-remove-button';
        removeButton.innerHTML = '&times;';
        tagItem.appendChild(removeButton);
        var input = container.querySelector('.tag-input');
        container.insertBefore(tagItem, input);
    };

    ns.PixelOnDetailController.prototype.removeTag_ = function (tagElement) {
        tagElement.parentElement.removeChild(tagElement);
    };

    ns.PixelOnDetailController.prototype.clearTags_ = function (container) {
        container.querySelectorAll('.tag-item').forEach(tag => this.removeTag_(tag));
    };

    ns.PixelOnDetailController.prototype.getTagsAsString_ = function (container) {
        return Array.from(container.querySelectorAll('.tag-item')).map(tag => tag.firstChild.textContent.trim()).join(', ');
    };

    // =================================================================
    //                              Utilities
    // =================================================================
    ns.PixelOnDetailController.prototype.createImageCallback_ = function(frame) {
        this.piskelController.addFrameAtCurrentIndex();
        const targetFrame = this.piskelController.getCurrentFrame();
        this.drawFrameCentered_(targetFrame, frame);
    }

    ns.PixelOnDetailController.prototype.overwriteCurrentFrameCallback_ = function(frame) {
        const targetFrame = this.piskelController.getCurrentFrame();
        targetFrame.clear();
        this.drawFrameCentered_(targetFrame, frame);
        $.publish(Events.PISKEL_SAVE_STATE, { type: pskl.service.HistoryService.SNAPSHOT });
    }

    ns.PixelOnDetailController.prototype.drawFrameCentered_ = function (targetFrame, sourceFrame) {
        const offsetX = Math.floor((targetFrame.getWidth() - sourceFrame.getWidth()) / 2);
        const offsetY = Math.floor((targetFrame.getHeight() - sourceFrame.getHeight()) / 2);
        sourceFrame.forEachPixel((color, x, y) => {
            if (color !== pskl.utils.colorToInt(Constants.TRANSPARENT_COLOR)) {
                targetFrame.setPixel(x + offsetX, y + offsetY, color);
            }
        });
    };

    ns.PixelOnDetailController.prototype.createSizeWarningElement_ = function () {
        var warningEl = document.createElement('span');
        warningEl.className = 'size-warning';
        warningEl.textContent = "Selected Image's size is bigger than Palette.";
        warningEl.style.display = 'none';
        return warningEl;
    };

    ns.PixelOnDetailController.prototype.replay = function (frame, replayData) {
        if (replayData.kind === 'overwrite') {
            frame.setPixels(replayData.pixels);
            $.publish(Events.FRAME_DID_UPDATE);
        } else if (replayData.kind === 'addFrames') {
            replayData.frames.forEach(f => {
                this.piskelController.addFrameAtCurrentIndex();
                this.piskelController.getCurrentFrame().setPixels(f.pixels);
            });
            $.publish(Events.FRAME_DID_UPDATE);
        }
    }
})();
