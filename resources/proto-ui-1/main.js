$().ready(function(){


	$(document).on('click', '.tile-close', function(evt) {
		$(evt.target).closest('.preview-item').remove();
	});

	$(document).on('click', '.preview-item', function(evt) {
		$('.preview-item').removeClass('selected');
		$(evt.target).closest('.preview-item').addClass('selected');
	});

	$(document).on('click', '#toggle-mode', function(evt) {
		$('body').toggleClass('grid-mode');
	});
/*
	$(document).on('click', '#change-draw-area', function(evt) {
		$('body').toggleClass('grid-mode');
	});*/
	$("#change-draw-area").change(function () {
	  var str = "";
	  $("#change-draw-area option:selected").each(function () {
	            str = $(this).val();
	  });
	  $(".canvas .draw-area").attr('class', 'draw-area draw-area-'+ str);
	})
});