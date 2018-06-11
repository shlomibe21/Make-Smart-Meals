'use strict';

let query;
let pageToken;
let nextPageToken;
let prevPageToken;

function closeVideo() {
	// Stop the video
	$('.modal' + ' iframe').attr('src', '');
	// Close the modal
	$('.modal').hide();
}

function closeModalDocClick() {
	$(document).on('click', '.modal', function(event) {
		// if modal is acitve and user clicks on anything except the video, close the modal.
		if (!$(event.target).closest(".centered-content").length) {
			closeVideo();
		}
	});
}

function closeModalClick() {
	$('.js-youtube-video').on('click', '.modal-close', function(event) {
		closeVideo();
	});
}

function closeModalKeyupClick() {
	$('.js-youtube-video').on('keyup', '.modal-close', function(event) {
		if(event.keyCode === 13) {
			closeVideo();
		}
	});
}

function videoTemplate(videoId) {
	return `
		<div class="modal">
    	<div class="centered-content">
		<div class="videowrapper">
		<iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
		</div>
		<span class="modal-close" tabindex=0>&times;</span>
		</div></div>
		`;
}

function thumbnailClick() {
	$('.js-youtube-search-results').on('click', '.thumbnail', function(event) {
		let videoId = $(this).data('videoid');
		const video = videoTemplate(videoId);
		$('.js-youtube-video').html(video);
	});
}

function thumbnailKeyupClick() {
	$('.js-youtube-search-results').on('keyup', '.thumbnail', function(event) {
		if(event.keyCode === 13) {
			let videoId = $(this).data('videoid');
			const video = videoTemplate(videoId);
			$('.js-youtube-video').html(video);
		}
	});
}

function searchBoxTyping() {
	$('.js-query').keyup(function(event) {
		if($(this).val()==='') {
			$('.submit-button').prop('disabled', true);
		}
		else {
			$('.submit-button').prop('disabled', false);
		}
	});
}

function getEdamamRecipesFromApi(searchTerm, callback) {
	// Clear result info area to make sure that it will be read again when we are adding new results info.
	$('.results-info').html('');
	const settings = {
		url: SEARCH_URL.EDAMAM,
		data: {
			q: searchTerm,
			app_id: API_ID.EDAMAM,
			app_key: API_KEY.EDAMAM,
			from: 0,
			to: 4,
		},
		dataType: 'json',
		type: 'GET',
		success: callback,
	};
	
	$.ajax(settings);
}

function renderEdamamResult(result) {
	console.log("LABEL: " + result.recipe.label);
	return `
    <div class="thumbnail-div col-3">
	<a class="thumbnail" title="${result.recipe.label}">	
	<img src=${result.recipe.image} alt="${result.recipe.label}" tabindex="0"></a>
	</div>
  	`;
}

function displayEdmamSearchData(data) {
	let nextButton='';
	let prevButton='';
	let pageContent;
	//let totalResults = `We found about ${data.pageInfo.totalResults} results`;
	//nextPageToken = data.nextPageToken;
	//prevPageToken = data.prevPageToken;
	//console.log(data);
	const results = data.hits.map((item, index) => renderEdamamResult(item));
	//console.log(data.hits.recipe.label);
	//$('.results-info').html(totalResults);
	const template = `
		<section role="region">
		<legend>Recipes:</legend>
		${results.join("")}
		</region>
	`;
	$('.js-edamam-search-results').html(template);
	/*if(prevPageToken) {
		$('.prev-youtube-page-button').show();
	}
	else {
		$('.prev-youtube-page-button').hide();
	}
	if(nextPageToken) {
		$('.next-youtube-page-button').show();
	}
	else {
		$('.next-youtube-page-button').hide();
	}*/
}

 function getYouTubeDataFromApi(searchTerm, callback) {
	// Clear result info area to make sure that it will be read again when we are adding new results info.
	$('.results-info').html('');
	const settings = {
		url: SEARCH_URL.YOUTUBE,
		data: {
			part: 'snippet',
			q: `${searchTerm} recipes`,
			maxResults: '8',
			pageToken: pageToken,
			key: API_KEY.YOUTUBE,
		},
		dataType: 'json',
		type: 'GET',
		success: callback,
	};

	$.ajax(settings);
}

function renderYouTubeResult(result) {
	return `
    <div class="thumbnail-div col-3">
	<a class="thumbnail" data-videoId="${result.id.videoId}" title="${result.snippet
		.title}">	
	<img src=${result.snippet.thumbnails.medium.url} alt="${result.snippet
		.title}" tabindex="0"></a>
	<a href="https://www.youtube.com/channel/${result.snippet
		.channelId}" class="channel-link" target="blank">More from this channel...</a>
	</div>
  	`;
}

function displayYouTubeSearchData(data) {
	console.log("DATA: " + data.pageInfo.totalResults);
	let nextButton='';
	let prevButton='';
	let pageContent;
	let totalResults = `We found about ${data.pageInfo.totalResults} results`;
	nextPageToken = data.nextPageToken;
	prevPageToken = data.prevPageToken;
	const results = data.items.map((item, index) => renderYouTubeResult(item));
	$('.results-info').html(totalResults);

	const template = `
		<hr>
		<section role="region">
		<legend>Videos:</legend>
		${results.join("")}
		</region>
	`;
	$('.js-youtube-search-results').html(template);
	if(prevPageToken) {
		$('.prev-youtube-page-button').show();
	}
	else {
		$('.prev-youtube-page-button').hide();
	}
	if(nextPageToken) {
		$('.next-youtube-page-button').show();
	}
	else {
		$('.next-youtube-page-button').hide();
	}
}

function nextPageClick() {
	$('.js-youtube-control-buttons').on('click', '.next-youtube-page-button', function(event) {
		pageToken = nextPageToken;
		getYouTubeDataFromApi(query, displayYouTubeSearchData);
	});
}

function prevPageClick() {
	$('.js-youtube-control-buttons').on('click', '.prev-youtube-page-button', function(event) {
		pageToken = prevPageToken;
		getYouTubeDataFromApi(query, displayYouTubeSearchData);
	});
}

function searchSubmit() {
	$('.js-search-form').submit(event => {
		event.preventDefault();
		const queryTarget = $(event.currentTarget).find('.js-query');
		query = queryTarget.val();
		// Clear out the input
		queryTarget.val('');
		$('.submit-button').prop('disabled', true);
		getEdamamRecipesFromApi(query,displayEdmamSearchData);
		getYouTubeDataFromApi(query, displayYouTubeSearchData);
	});
}

function handleYoutubeSearch() {
	searchSubmit();
	searchBoxTyping();
	thumbnailClick();
	thumbnailKeyupClick();
	nextPageClick();
	prevPageClick();
	closeModalClick();
	closeModalDocClick();
	closeModalKeyupClick();
}

$(handleYoutubeSearch);
