'use strict';

let query;
let pageToken;
let youTubeNextPageToken;
let youTubePrevPageToken;

function closeVideo() {
	// Stop the video
	$('.modal' + ' iframe').attr('src', '');
	// Close the modal
	$('.modal').hide();
}

function closeModalDocClick() {
	$(document).on('click', '.modal', function (event) {
		// if modal is acitve and user clicks on anything except the video, close the modal.
		if (!$(event.target).closest(".centered-content").length) {
			closeVideo();
		}
	});
}

function closeModalClick() {
	$('.js-youtube-video').on('click', '.modal-close', function (event) {
		closeVideo();
	});
}

function closeModalKeyupClick() {
	$('.js-youtube-video').on('keyup', '.modal-close', function (event) {
		// Close modal in case that user clicks on the Enter key
		if (event.keyCode === 13) {
			closeVideo();
		}
	});
}

function searchAgainButtonClick() {
	$('#search-again-button').click(function(event) {
		$('#search-again-button').hide();
		$('.search-container').show();
		// Remove previous stuff from the page
		//$('.js-edamam-results').empty();
		//$('.js-youtube-results').empty();
		
	});
}

function clearSearchFieldsClick() {
	$('#clear-search-fields').click(function(event) {
		clearAllFormFields();
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

function youtubeThumbnailClick() {
	$('#js-youtube-breakfast-results,#js-youtube-lunch-results,#js-youtube-dinner-results').on('click', '.thumbnail', function(event) {
		let videoId = $(this).data('videoid');
		const video = videoTemplate(videoId);
		$('.js-youtube-video').html(video);
	});
}

function youtubeThumbnailKeyup() {
	$('#js-youtube-breakfast-results,#js-youtube-lunch-results,#js-youtube-dinner-results').on('keyup', '.thumbnail', function(event) {
		// Open youtube video when user is clicking on the Enter key
		if (event.keyCode === 13) {
			let videoId = $(this).data('videoid');
			const video = videoTemplate(videoId);
			$('.js-youtube-video').html(video);
		}
	});
}

// TODO: use this event to display ingredients
function edamamThumbnailClick() {
	$('#js-edamam-breakfast-results,#js-edamam-lunch-results,#js-edamam-dinner-results').on('click', '.thumbnail', function(event) {
		
	});
}

// TODO: use this event to display ingredients
function edamamThumbnailKeyup() {
	$('#js-edamam-breakfast-results,#js-edamam-lunch-results,#js-edamam-dinner-results').on('keyup', '.thumbnail', function(event) {
		if (event.keyCode === 13) {
			
		}
	});
}

//function searchBoxTyping() {
	//$('.js-query').keyup(function (event) {
		//if ($(this).val() === '') {
			//$('.submit-button').prop('disabled', true);
		//}
		//else {
			//$('.submit-button').prop('disabled', false);
		//}
	//});
//}

function clearAllFormFields() {
	$("input").val("");
	$("select").val("");
}

function getEdamamRecipes(searchQuery, callback) {
	const settings = {
		url: SEARCH_URL.EDAMAM,
		data: {
			q: searchQuery.q,
			calories: searchQuery.calories,
			ingr: searchQuery.ingr,
			diet: searchQuery.diet,
			health: searchQuery.health,
			from: 0,
			to: 4,
			app_id: API_ID.EDAMAM,
			app_key: API_KEY.EDAMAM},
		dataType: 'json',
		type: 'GET',
		success: callback,
		error: function (jqXHR) {
			// TODO: print an error to the user
			console.log("Error: " + jqXHR);
		},
	};
	$.ajax(settings);
}

function renderEdamamResult(result) {
	//console.log("recipe.dietLabels: " + result.recipe.dietLabels);
	//console.log("recipe.healthLabels: " + result.recipe.healthLabels);
	//console.log("recipe.allergen: " + result.allergen);
	return `
    <div class="col-3">
	<div class="thumbnail-div">
	<a class="thumbnail" title="${result.recipe.label}">	
	<img src=${result.recipe.image} alt="${result.recipe.label}" tabindex="0"></a>
	<p>${result.recipe.label}</P>
	<a href="${result.recipe.url}" target="_blank">${result.recipe.source}</a>
	</div>
	</div>
  	`;
}

function displayEdamamResults(data, meal) {
	let nextButton = '';
	let prevButton = '';
	let pageContent;
	let template;
	
	// Make sure that data is valid, if not display error message
	if((!data) || (data.count ===0)) {
		template = `
		<hr>
		<p class="meal-title">${meal}</p>
		<p>We couldn't find any recipe!</p>
		`;
	}
	else {
		//console.log(data.count);
		//let totalResults = `We found about ${data.count} results`;
		const results = data.hits.map((item, index) => renderEdamamResult(item));
		//$('.results-info').html(totalResults);
		template = `
		<hr>
		<p class="meal-title">${meal}</p>
		<section role="region">
		<legend>Recipes:</legend>
		${results.join("")}
		</region>
		`;	
	}
	
	switch(meal) {
		case 'Breakfast':
			$('#js-edamam-breakfast-results').html(template);
		break;
		case 'Lunch':
			$('#js-edamam-lunch-results').html(template);
		break;
		case 'Dinner':
			$('#js-edamam-dinner-results').html(template);
		break;
	}
}

function displayEdamamBreakfastResults(data) {
	displayEdamamResults(data, 'Breakfast')
}

function displayEdamamLunchResults(data) {
	displayEdamamResults(data, 'Lunch')
}

function displayEdamamDinnerResults(data) {
	displayEdamamResults(data, 'Dinner')
}

function getYouTubeDataFromApi(searchTerm, callback) {
	const settings = {
		url: SEARCH_URL.YOUTUBE,
		data: {
			part: 'snippet',
			q: `${searchTerm} recipes`,
			maxResults: '4',
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
    <div class="col-3">
	<div class="thumbnail-div">
	<a class="thumbnail" data-videoId="${result.id.videoId}" title="${result.snippet
			.title}">	
	<img src=${result.snippet.thumbnails.medium.url} alt="${result.snippet
			.title}" tabindex="0"></a>
	<a href="https://www.youtube.com/channel/${result.snippet
			.channelId}" class="channel-link" target="blank">More...</a>
	</div>
	</div>
  	`;
}

function displayYouTubeSearchResults(data, meal) {
	let nextButton = '';
	let prevButton = '';
	let pageContent;
	let template;

	if((!data) || (data.pageInfo.totalResults === 0)) {
		template = `
		<p>We couldn't find any video!</p>
		`;
	}
	else {
		//let totalResults = `We found about ${data.pageInfo.totalResults} results`;
		youTubeNextPageToken = data.youTubeNextPageToken;
		youTubePrevPageToken = data.youTubePrevPageToken;
		const results = data.items.map((item, index) => renderYouTubeResult(item));
		//$('.results-info').html(totalResults);
		//$('.js-youtube-search-results').html(results);

		template = `
			<section role="region">
			<legend>Suggested Videos:</legend>
			${results.join("")}
			</region>
		`;
	}

	switch(meal) {
		case 'Breakfast':
			$('#js-youtube-breakfast-results').html(template);
		break;
		case 'Lunch':
			$('#js-youtube-lunch-results').html(template);
		break;
		case 'Dinner':
			$('#js-youtube-dinner-results').html(template);
		break;
	}

	// Display next page and prev page buttons
	// Not in use for now
	//$('.js-youtube-search-results').html(template);
	//if (youTubePrevPageToken) {
		//$('.prev-youtube-page-button').show();
	//}
	//else {
		//$('.prev-youtube-page-button').hide();
	//}
	//if (youTubeNextPageToken) {
		//$('.next-youtube-page-button').show();
	//}
	//else {
		//$('.next-youtube-page-button').hide();
	//}
}

function displayYouTubeBreakfastResults(data) {
	displayYouTubeSearchResults(data, 'Breakfast')
}

function displayYouTubeLunchResults(data) {
	displayYouTubeSearchResults(data, 'Lunch')
}

function displayYouTubeDinnerResults(data) {
	displayYouTubeSearchResults(data, 'Dinner')
}

function nextPageClick() {
	$('.js-youtube-control-buttons').on('click', '.next-youtube-page-button', function (event) {
		pageToken = youTubeNextPageToken;
		getYouTubeDataFromApi(query, displayYouTubeSearchResults);
	});
}

function prevPageClick() {
	$('.js-youtube-control-buttons').on('click', '.prev-youtube-page-button', function (event) {
		pageToken = youTubePrevPageToken;
		getYouTubeDataFromApi(query, displayYouTubeSearchResults);
	});
}

function searchSubmit() {
	$('.js-search-form').submit(event => {
		event.preventDefault();
		// Fetch all the the data from the form
		var fields = $("form").serializeArray();
		let breakfastQuery;
		let lunchQuery;
		let dinnerQuery;
		// Make a plan for 3 meals a day
		const numOfMeals = 3;
		// Set default min and max calories
		let minCalories = 100;
		let maxCalories = 10000;	
		// Split calories between meals evenly
		let minCaloriesPerMeal = Math.floor(minCalories/numOfMeals);
		let maxCaloriesPerMeal = Math.floor(maxCalories/numOfMeals);
		// Create a searchQuery object
		let searchQuery = {};

		// Update 'searchQuery' with the values from the form
		jQuery.each(fields, function (i, field) {
			//console.log(field.name + ": " + field.value);
			switch (field.name) {
				case "breakfast-query":
					breakfastQuery = field.value;
				break;
				case "lunch-query":
					lunchQuery = field.value;
				break;
				case "dinner-query":
					dinnerQuery = field.value;
				break;
				case "max-ingredients":
					if (field.value) {
						searchQuery.ingr = field.value;
					}
				break;
				case "diet":
					if (field.value) {
						searchQuery.diet = field.value;
					}
				break;
				case "health":
					if (field.value) {
						searchQuery.health = field.value;
					}
				break;
				case "calories-min":
					if (field.value) {
						minCaloriesPerMeal = Math.floor(field.value/numOfMeals);
					}
				break;
				case "calories-max":
					if (field.value) {
						maxCaloriesPerMeal = Math.floor(field.value/numOfMeals);
					}
				break;
			}
		});
		// After fetching data from the form, validate min and max calories and update the system
		if (parseInt(maxCaloriesPerMeal) <= parseInt(minCaloriesPerMeal)) {
			alert("Max calories should be higher than Min calories!");
			return;
		}
		searchQuery.calories = minCaloriesPerMeal + '-' + maxCaloriesPerMeal;

		$('.search-container').hide();
		$('#search-again-button').show();

		searchQuery.q = breakfastQuery + ", breakfast";
		getEdamamRecipes(searchQuery, displayEdamamBreakfastResults);
		getYouTubeDataFromApi(searchQuery.q, displayYouTubeBreakfastResults);
		searchQuery.q = lunchQuery + ", lunch";
		getEdamamRecipes(searchQuery, displayEdamamLunchResults);
		getYouTubeDataFromApi(searchQuery.q, displayYouTubeLunchResults);
		searchQuery.q = dinnerQuery + ", dinner";
		getEdamamRecipes(searchQuery, displayEdamamDinnerResults);
		getYouTubeDataFromApi(searchQuery.q, displayYouTubeDinnerResults);
	});
}

function handleYoutubeSearch() {
	searchSubmit();
	youtubeThumbnailClick();
	youtubeThumbnailKeyup();
	edamamThumbnailClick();
	edamamThumbnailKeyup();
	nextPageClick();
	prevPageClick();
	closeModalClick();
	closeModalDocClick();
	closeModalKeyupClick();
	searchAgainButtonClick();
	clearSearchFieldsClick();
	//searchBoxTyping();
}

$(handleYoutubeSearch);
