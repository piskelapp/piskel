$().ready(function(){

	var body = $('body');
	var mainWrapper = $(".main-wrapper");
	var canvas = $("#canvas");

	var resizeCanvas = function() {
		canvas.height(mainWrapper.height());
		canvas.width(mainWrapper.height());
	};

	var selectTile = function(tileElement) {
		$('.preview-item').removeClass('selected');
		tileElement.addClass('selected');
		if(body.hasClass('hor-list-mode')) {
			var index = $('.preview-item:not(.drop-target)').index(tileElement);
			console.log(index);
			$('.previewlist').animate({
			    scrollLeft: -100 + 100 * index
			 }, 300);
		}
	};
	selectTile($('.preview-item').eq(4));

	$(document).on('click', '.tile-close', function(evt) {
		$(evt.target).closest('.preview-item').remove();
	});

	$(document).on('click', '.preview-item', function(evt) {
		selectTile($(evt.target).closest('.preview-item'));
	});

	$(document).on('click', '.tool', function(evt) {
		$('.tool').removeClass('selected');
		$(evt.target).closest('.tool').addClass('selected');
	});

	$(window).resize(resizeCanvas);
	resizeCanvas();

	/**
	 * Admin stuff
	 */

	$(document).on('click', '#toggle-frame-mode', function(evt) {
		if(body.hasClass('grid-mode')) {
			$('body').removeClass('grid-mode');
			$('body').addClass('hor-list-mode');
		} else if (body.hasClass('hor-list-mode')) {
			$('body').removeClass('hor-list-mode');
			$('body').addClass('vert-list-mode');
		}
		else if (body.hasClass('vert-list-mode')) {
			$('body').removeClass('vert-list-mode');
			$('body').addClass('grid-mode');
		}
		resizeCanvas();
	});

	$(document).on('click', '#toggle-dnd-state', function(evt) {
		
		body.toggleClass('dnd-state1');
	});

	$("#change-draw-area").change(function () {
	  var str = "";
	  $("#change-draw-area option:selected").each(function () {
	            str = $(this).val();
	  });
	  $(".canvas .draw-area").attr('class', 'draw-area draw-area-'+ str);
	});

	

});