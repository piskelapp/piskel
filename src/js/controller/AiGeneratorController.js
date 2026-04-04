(function () {
    var ns = $.namespace('pskl.controller');

    ns.AiGeneratorController = function (piskelController) {
        this.piskelController = piskelController;
        this.pixelOnController = pskl.app.pixelOnController;
        this.sdController = pskl.app.sdController;
        this.callbackId = 'ai-generator';
        this.currentSessionId = null;
    };

    ns.AiGeneratorController.prototype.init = function () {
        this.container = document.querySelector('.ai-generator-container');
        if (!this.container) return;

        this.positivePromptContainer = this.container.querySelector('#ai-positive-prompt');
        this.positivePromptInput = this.positivePromptContainer.querySelector('.tag-input');
        this.statusTextEl = this.container.querySelector('.status-text');
        this.generateButton = this.container.querySelector('[data-action="generate"]');
        this.helpButton = this.container.querySelector('.pixelon-help-button');

        this.isGenerating = false;

        this.sdController.registerCallbacks(this.callbackId, {
            onProgress: this.updateUiForGenerationState_.bind(this),
            onImage: this.onImageReceive_.bind(this),
            onError: this.onGenerationError_.bind(this)
        });

        this.initButtons_();
        this.initTagInput_();
        document.addEventListener('click', this.onDocumentClick_.bind(this));
    };

    ns.AiGeneratorController.prototype.onDocumentClick_ = function (evt) {
        if (!evt.target.closest('.tag-input-container')) {
            var tagToDelete = this.container.querySelector('.tag-to-delete');
            if (tagToDelete) {
                tagToDelete.classList.remove('tag-to-delete');
            }
        }
    };

    ns.AiGeneratorController.prototype.initButtons_ = function () {
        var buttons = this.container.querySelectorAll('.ai-generator-button');
        buttons.forEach(function(button) {
            button.addEventListener('click', this.onButtonClick_.bind(this));
        }.bind(this));

        if (this.helpButton) {
            this.helpButton.addEventListener('click', this.onHelpClick_.bind(this));
        }
    };

    ns.AiGeneratorController.prototype.initTagInput_ = function () {
        this.positivePromptInput.addEventListener('keydown', this.onTagInputKeyDown_.bind(this, this.positivePromptContainer));
        this.positivePromptContainer.addEventListener('click', this.onTagContainerClick_.bind(this));
    };

    ns.AiGeneratorController.prototype.onHelpClick_ = function () {
        var currentUrl = window.location.href;
        var tutorialUrl = currentUrl.replace(/#.*$/, '') + 'tutorial';
        window.open(tutorialUrl, '_blank');
    };

    ns.AiGeneratorController.prototype.onButtonClick_ = function (event) {
        var action = event.currentTarget.dataset.action;

        if (action === 'toggle-detail') {
            $.publish(Events.DIALOG_SHOW, { dialogId: 'pixel-on-detail' });
        } else if (action === 'generate') {
            if (this.isGenerating) {
                if (this.currentSessionId) {
                    this.sdController.stop(this.currentSessionId);
                }
            } else {
                var text = this.positivePromptInput.value.trim();
                if (text) {
                    text.split(',').forEach(tag => {
                        if (tag.trim()) {
                            this.addTag_(this.positivePromptContainer, tag.trim());
                        }
                    });
                    this.positivePromptInput.value = '';
                }

                if (this.startGeneration_()) {
                    this.clearTags_(this.positivePromptContainer);
                }
            }
        }
    };

    ns.AiGeneratorController.prototype.updateOrCreateSession_ = function () {
        var positivePrompt = this.getTagsAsString_(this.positivePromptContainer);
        var currentPiskel = this.piskelController.getPiskel();
        var spec = {
            p_prompt: positivePrompt,
            n_prompt: "",
            width: currentPiskel.width,
            height: currentPiskel.height,
            count: 1,
            color_qunt: 48,
            seed: -1,
            preset: 'general'
        };

        if (this.currentSessionId) {
            var session = this.pixelOnController.getSessionByUuid(this.currentSessionId);
            if (session) {
                session.setSpec(spec);
                session.setName(spec.p_prompt);
            } else {
                this.currentSessionId = null;
            }
        }
        
        if (!this.currentSessionId) {
            var newSession = new pskl.model.pixelOn.AiSession(spec.p_prompt, spec);
            this.pixelOnController.addSession(newSession);
            this.currentSessionId = newSession.getUuid();
        }
    };

    ns.AiGeneratorController.prototype.startGeneration_ = function () {
        this.updateOrCreateSession_();

        var session = this.pixelOnController.getSessionByUuid(this.currentSessionId);
        if (!session || !session.getSpec().p_prompt) {
            this.updateUiForGenerationState_(false, 'Prompt is empty.');
            return false;
        }

        this.sdController.generate(session.getSpec(), this.currentSessionId);
        return true;
    };

    ns.AiGeneratorController.prototype.onImageReceive_ = function(data) {
        if (data.session_id !== this.currentSessionId) {
            return;
        }

        const imageData = this.pixelOnController.getImage(data.imgUuid);
        if (!imageData) return;

        pskl.utils.FrameUtils.createFromImageSrc(imageData.image, false, function(frame) {
            this.piskelController.addFrameAtCurrentIndex();
            var targetFrame = this.piskelController.getCurrentFrame();
            targetFrame.setPixels(frame.pixels);
            $.publish(Events.PISKEL_SAVE_STATE, { type: pskl.service.HistoryService.SNAPSHOT });
        }.bind(this));
    };

    ns.AiGeneratorController.prototype.onGenerationError_ = function(errorMessage) {
        console.error("Generation Error reported to AiGeneratorController:", errorMessage);
    };

    ns.AiGeneratorController.prototype.updateUiForGenerationState_ = function(isGenerating, statusMessage, sessionId) {
        this.isGenerating = isGenerating;

        if (isGenerating) {
            if (sessionId && this.currentSessionId === sessionId) {
                this.statusTextEl.textContent = statusMessage || '';
                this.generateButton.textContent = 'Stop';
                this.generateButton.classList.add('stop-button');
            } else {
                this.statusTextEl.textContent = 'Generating in Modal...';
            }
        } else {
            this.statusTextEl.textContent = statusMessage || '';
            this.generateButton.textContent = 'Generate';
            this.generateButton.classList.remove('stop-button');
            if (sessionId === this.currentSessionId) {
                this.currentSessionId = null;
            }
        }
    };

    // =================================================================
    //                            Tag Management
    // =================================================================

    ns.AiGeneratorController.prototype.onTagInputKeyDown_ = function (container, event) {
        var input = event.target;
        var tagToDelete = container.querySelector('.tag-to-delete');

        if (event.key === 'Enter') {
            event.preventDefault();
            var text = input.value.trim();
            if (text) {
                this.addTag_(container, text);
                input.value = '';
                this.updateOrCreateSession_();
            }
            if (tagToDelete) {
                tagToDelete.classList.remove('tag-to-delete');
            }
        } else if (event.key === 'Backspace' && input.value === '') {
            if (tagToDelete) {
                var tagText = tagToDelete.firstChild.textContent.trim();
                this.removeTag_(tagToDelete);
                input.value = tagText + ' ';
                this.updateOrCreateSession_();
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

    ns.AiGeneratorController.prototype.onTagContainerClick_ = function (event) {
        if (event.target.classList.contains('tag-remove-button')) {
            this.removeTag_(event.target.parentElement);
            this.updateOrCreateSession_();
        } else if (event.target.classList.contains('tag-input-container')) {
            event.target.querySelector('.tag-input').focus();
        }
    };

    ns.AiGeneratorController.prototype.addTag_ = function (container, text) {
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

    ns.AiGeneratorController.prototype.removeTag_ = function (tagElement) {
        tagElement.parentElement.removeChild(tagElement);
    };

    ns.AiGeneratorController.prototype.clearTags_ = function (container) {
        var tags = container.querySelectorAll('.tag-item');
        tags.forEach(tag => this.removeTag_(tag));
    };

    ns.AiGeneratorController.prototype.getTagsAsString_ = function (container) {
        return Array.from(container.querySelectorAll('.tag-item')).map(tag => tag.firstChild.textContent.trim()).join(', ');
    };
})();
