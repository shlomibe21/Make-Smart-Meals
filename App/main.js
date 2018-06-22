'use strict';

// Create a searchQuery object
let searchQuery = {};
// Youtube parameters
let youTubePageToken;
let youTubeBreakfastNextPageToken;
let youTubeBreakfastPrevPageToken;
let youTubeLunchNextPageToken;
let youTubeLunchPrevPageToken;
let youTubeDinnerNextPageToken;
let youTubeDinnerPrevPageToken;
// Edamam parameters
const edamamGetMinRecipeNum = 0;
const edamamGetMaxRecipeNum = 40;
const edamamRecipesPerPage = 4;
let edamamMinBreakfastRecipeNum = 0;
let edamamMaxBreakfastRecipeNum = edamamRecipesPerPage;
let edamamMinLunchRecipeNum = 0;
let edamamMaxLunchRecipeNum = edamamRecipesPerPage;
let edamamMinDinnerRecipeNum = 0;
let edamamMaxDinnerRecipeNum = edamamRecipesPerPage;
// Store the entire data for each meal from Edamam server here
let edamamBreakfastData;
let edamamLunchData;
let edamamDinnerData;
// Set default min and max calories
const defaultMinCalories = 10;
const defaultMaxCalories = 10000;

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
		$('.search-container').slideDown("slow");
		// Reset youTubePageToken
		youTubePageToken = null;		
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

function edamamThumbnailClick() {
	$('#js-edamam-breakfast-results,#js-edamam-lunch-results,#js-edamam-dinner-results').on('click', '.thumbnail', function(event) {
		let url = $(this).data('recipeurl');
		window.open(url);
	});
}

function edamamThumbnailKeyup() {
	$('#js-edamam-breakfast-results,#js-edamam-lunch-results,#js-edamam-dinner-results').on('keyup', '.thumbnail', function(event) {
		if (event.keyCode === 13) {
			let url = $(this).data('recipeurl');
			window.open(url);
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
	$("#calories-min").val(defaultMinCalories);
	$("#calories-max").val(defaultMaxCalories);
}

function getEdamamRecipes(searchQuery, callback, meal) {	
	const settings = {
		url: SEARCH_URL.EDAMAM,
		data: {
			q: searchQuery.query,
			calories: searchQuery.calories,
			ingr: searchQuery.ingr,
			diet: searchQuery.diet,
			health: searchQuery.health,
			from: edamamGetMinRecipeNum,
			to: edamamGetMaxRecipeNum,
			app_id: API_ID.EDAMAM,
			app_key: API_KEY.EDAMAM
		},
		dataType: 'json',
		type: 'GET',
		success: callback,
		error: function (jqXHR) {
			// TODO: print an error to the user
			alert("EDAMAM SERVER ERROR! Can't display " + meal + " results. Please wait a few minutes and try again.");
			console.log("Error: " + jqXHR);
		},
	};
	$.ajax(settings);
}

function renderEdamamResult(result) {
	if(!result) {
		return;
	}
	let calories;
	let infoTemplate ='';
	if((result.recipe.calories) && (result.recipe.yield)) {
		calories = result.recipe.calories/result.recipe.yield;
		calories = Math.floor(calories);
		infoTemplate = `Calories:${calories} Yield:${result.recipe.yield}`;
	}
	
	return `
    <div class="col-3 thumbnail-div">
	<a class="thumbnail" data-recipeUrl="${result.recipe.url}" title="${result.recipe.label}">	
	<img src=${result.recipe.image} alt="${result.recipe.label}" tabindex="0"></a>
	<p>${result.recipe.label}</P>
	<p class="recipe-info">${infoTemplate}</p>
	<a href="${result.recipe.url}" target="_blank">${result.recipe.source}</a>
	</div>
  	`;
}

function displayEdamamResults(data, meal, edamamFirstRecipeNum, edamamLastRecipeNum) {
	let pageContent;
	let template;
	let imgSrc;
	let imgAlt;
	let divId;
	let prevButton = '';
	let nextButton = '';
	let prevButtonId;
	let nextButtonId;
	
	// Make sure that data is valid, if not display error message
	if(!data) {
		alert("Error! Sorry, we can't display any recipe!");
		return;
	}

	switch(meal) {
		case 'Breakfast':
			edamamBreakfastData = data;
			imgSrc = "breakfast-square.jpg";
			imgAlt = "Breakfast Image";
			divId = '#js-edamam-breakfast-results';
			prevButtonId = 'js-edamam-prev-page-breakfast';
			nextButtonId = 'js-edamam-next-page-breakfast';

			if(edamamBreakfastData.count > edamamGetMaxRecipeNum) {
				edamamBreakfastData.count = edamamGetMaxRecipeNum;
			}
			if(edamamFirstRecipeNum < 0) {
				edamamFirstRecipeNum = 0;
			}
			if(edamamLastRecipeNum > edamamBreakfastData.count) {
				edamamLastRecipeNum = edamamBreakfastData.count;
			}

			if(edamamFirstRecipeNum > 0) {
				prevButton = `<button type="button" class="prev-page-button" id=${prevButtonId}><span>Previous</span></button>`;
			}
			
			if(edamamLastRecipeNum < edamamBreakfastData.count) {
				nextButton = `<button type="button" class="next-page-button" id=${nextButtonId}><span>Next</span></button>`;		
			}
		break;
		case 'Lunch':
			edamamLunchData = data;
			imgSrc = "lunch-square.jpg";
			imgAlt = "Lunch Image";
			divId = '#js-edamam-lunch-results';
			prevButtonId = 'js-edamam-prev-page-lunch';
			nextButtonId = 'js-edamam-next-page-lunch';

			if(edamamLunchData.count > edamamGetMaxRecipeNum) {
				edamamLunchData.count = edamamGetMaxRecipeNum;
			}
			if(edamamFirstRecipeNum < 0) {
				edamamFirstRecipeNum = 0;
			}
			if(edamamLastRecipeNum > edamamLunchData.count) {
				edamamLastRecipeNum = edamamLunchData.count;
			}

			if(edamamFirstRecipeNum > 0) {
				prevButton = `<button type="button" class="prev-page-button" id=${prevButtonId}><span>Previous</span></button>`;
			}
			if(edamamLastRecipeNum < edamamLunchData.count) {
				nextButton = `<button type="button" class="next-page-button" id=${nextButtonId}><span>Next</span></button>`;
			}
		break;
		case 'Dinner':
			edamamDinnerData = data;
			imgSrc = "dinner-square.jpg";
			imgAlt = "Dinner Image";
			divId = '#js-edamam-dinner-results';
			prevButtonId = 'js-edamam-prev-page-dinner';
			nextButtonId = 'js-edamam-next-page-dinner';

			if(edamamDinnerData.count > edamamGetMaxRecipeNum) {
				edamamDinnerData.count = edamamGetMaxRecipeNum;
			}
			if(edamamFirstRecipeNum < 0) {
				edamamFirstRecipeNum = 0;
			}
			if(edamamLastRecipeNum > edamamDinnerData.count) {
				edamamLastRecipeNum = edamamDinnerData.count;
			}

			if(edamamFirstRecipeNum > 0) {
				prevButton = `<button type="button" class="prev-page-button" id=${prevButtonId}><span>Previous</span></button>`;
			}
			if(edamamLastRecipeNum < edamamDinnerData.count) {
				nextButton = `<button type="button" class="next-page-button" id=${nextButtonId}><span>Next</span></button>`;
			}
		break;
	}

	// In case of no data display a message to user
	if(data.count === 0) {
		template = `
		<div class="row">
		<img src=${imgSrc} alt=${imgAlt} class="meal-icon"></a>
		<p class="meal-title">${meal}</p>
		<p>Sorry, we couldn't find any recipe!</p>
		</div>
		`;
	}
	else {
		// Build the template for the actual results to display on the page
		let results = [];
		let totalResults = data.count;
		let totalResultsStr = `We found about ${data.count} results`;

		try {
    		for(let i = edamamFirstRecipeNum; i < edamamLastRecipeNum; i++) {
				results.push(renderEdamamResult(data.hits[i]));
			}
		}
		catch(err) {
    		console.log(err);
			return;
		} 
		
		template = `
		<img src=${imgSrc} alt=${imgAlt} class="meal-icon"></a>
		<p class="meal-title">${meal}</p>
		<div class="row">
		<section role="region">
		<legend class="results-title">Recipes:</legend>
		${results.join("")}
		</div>
		<div>
		${prevButton}
		${nextButton}
		</div>
		</region>
		`;	
	}
	
	$(divId).html(template);
}

// Callback function
function displayEdamamBreakfastResults(data) {
	edamamMinBreakfastRecipeNum = 0;
	edamamMaxBreakfastRecipeNum = edamamRecipesPerPage;
	displayEdamamResults(data, 'Breakfast', edamamMinBreakfastRecipeNum, edamamMaxBreakfastRecipeNum);
}

// Callback function
function displayEdamamLunchResults(data) {
	edamamMinLunchRecipeNum = 0;
	edamamMaxLunchRecipeNum = edamamRecipesPerPage;
	displayEdamamResults(data, 'Lunch', edamamMinLunchRecipeNum, edamamMaxLunchRecipeNum);
}

// Callback function
function displayEdamamDinnerResults(data) {
	edamamMinDinnerRecipeNum = 0;
	edamamMaxDinnerRecipeNum = edamamRecipesPerPage;
	displayEdamamResults(data, 'Dinner', edamamMinDinnerRecipeNum, edamamMaxDinnerRecipeNum);
}

function getYouTubeDataFromApi(searchTerm, callback) {
	let query = searchTerm + " recipes";
	const settings = {
		url: SEARCH_URL.YOUTUBE,
		data: {
			part: 'snippet',
			q: query,
			maxResults: '4',
			pageToken: youTubePageToken,
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
	<div class="youtube-img">
	<img src=${result.snippet.thumbnails.medium.url} alt="${result.snippet
			.title}" tabindex="0"><img src="youtube-icon.png" class="youtube-play-icon"></a>
	</div>
	<a href="https://www.youtube.com/channel/${result.snippet
			.channelId}" class="channel-link" target="blank">More from this channel...</a>
	</div>
	</div>
  	`;
}

function displayYouTubeSearchResults(data, meal) {
	let template = '';
	let divId = '';
	let prevButton = '';
	let nextButton = '';
	let prevButtonId = '';
	let nextButtonId = '';
	
	switch(meal) {
		case 'Breakfast':
			divId = '#js-youtube-breakfast-results';
			prevButtonId = 'js-youtube-prev-page-breakfast';
			nextButtonId = 'js-youtube-next-page-breakfast';
			if(data) {
				if(data.prevPageToken) {
					youTubeBreakfastPrevPageToken = data.prevPageToken;
					prevButton = `<button type="button" class="prev-page-button" id=${prevButtonId}><span>Previous</span></button>`;
				}
				if(data.nextPageToken) {
					youTubeBreakfastNextPageToken = data.nextPageToken;
					nextButton = `<button type="button" class="next-page-button" id=${nextButtonId}><span>Next</span></button>`;
				}
			}
		break;
		case 'Lunch':
			divId = '#js-youtube-lunch-results';
			prevButtonId = 'js-youtube-prev-page-lunch';
			nextButtonId = 'js-youtube-next-page-lunch';
			if(data) {			
				if(data.prevPageToken) {
					youTubeLunchPrevPageToken = data.prevPageToken;
					prevButton = `<button type="button" class="prev-page-button" id=${prevButtonId}><span>Previous</span></button>`;
				}
				if(data.nextPageToken) {
					youTubeLunchNextPageToken = data.nextPageToken;
					nextButton = `<button type="button" class="next-page-button" id=${nextButtonId}><span>Next</span></button>`;
				}
			}
		break;
		case 'Dinner':
			divId = '#js-youtube-dinner-results';
			prevButtonId = 'js-youtube-prev-page-dinner';
			nextButtonId = 'js-youtube-next-page-dinner';
			if(data) {
				if(data.prevPageToken) {
					youTubeDinnerPrevPageToken = data.prevPageToken;
					prevButton = `<button type="button" class="prev-page-button" id=${prevButtonId}><span>Previous</span></button>`;
				}
				if(data.nextPageToken) {
					youTubeDinnerNextPageToken = data.nextPageToken;
					nextButton = `<button type="button" class="next-page-button" id=${nextButtonId}><span>Next</span></button>`;
				}
			}
		break;
	}

	if((!data) || (data.pageInfo.totalResults === 0)) {
		template = `
		<div class="row">
		<p>Sorry, we couldn't find any video!</p>
		</div>
		`;
	}
	else {
		const results = data.items.map((item, index) => renderYouTubeResult(item));

		template = `
			<section role="region">
			<div class="row">
			<legend class="results-title">Suggested Videos:</legend>
			${results.join("")}
			</div>
			<div>
			${prevButton}
			${nextButton}
			</div>
			</region>
		`;
	}
	// Display results on page for the current meal
	$(divId).html(template);
}

// Callback function
function displayYouTubeBreakfastResults(data) {
	displayYouTubeSearchResults(data, 'Breakfast')
}

// Callback function
function displayYouTubeLunchResults(data) {
	displayYouTubeSearchResults(data, 'Lunch')
}

// Callback function
function displayYouTubeDinnerResults(data) {
	displayYouTubeSearchResults(data, 'Dinner')
}

function youTubeNextPageBreakfastClick() {
	$('#js-youtube-breakfast-results').on('click', '#js-youtube-next-page-breakfast', function (event) {
		youTubePageToken = youTubeBreakfastNextPageToken;
		getYouTubeDataFromApi(searchQuery.breakfastQuery, displayYouTubeBreakfastResults);
	});
}

function youTubePrevPageBreakfastClick() {
	$('#js-youtube-breakfast-results').on('click', '#js-youtube-prev-page-breakfast', function (event) {
		youTubePageToken = youTubeBreakfastPrevPageToken;
		getYouTubeDataFromApi(searchQuery.breakfastQuery, displayYouTubeBreakfastResults);
	});
}

function youTubeNextPageLunchClick() {
	$('#js-youtube-lunch-results').on('click', '#js-youtube-next-page-lunch', function (event) {
		youTubePageToken = youTubeLunchNextPageToken;
		getYouTubeDataFromApi(searchQuery.lunchQuery, displayYouTubeLunchResults);
	});
}

function youTubePrevPageLunchClick() {
	$('#js-youtube-lunch-results').on('click', '#js-youtube-prev-page-lunch', function (event) {
		youTubePageToken = youTubeLunchPrevPageToken;
		getYouTubeDataFromApi(searchQuery.lunchQuery, displayYouTubeLunchResults);
	});
}

function youTubeNextPageDinnerClick() {
	$('#js-youtube-dinner-results').on('click', '#js-youtube-next-page-dinner', function (event) {
		youTubePageToken = youTubeDinnerNextPageToken;
		getYouTubeDataFromApi(searchQuery.dinnerQuery, displayYouTubeDinnerResults);
	});
}

function youTubePrevPageDinnerClick() {
	$('#js-youtube-dinner-results').on('click', '#js-youtube-prev-page-dinner', function (event) {
		youTubePageToken = youTubeDinnerPrevPageToken;
		getYouTubeDataFromApi(searchQuery.dinnerQuery, displayYouTubeDinnerResults);
	});
}

function edamamNextPageBreakfastClick() {
	$('#js-edamam-breakfast-results').on('click', '#js-edamam-next-page-breakfast', function (event) {
		edamamMaxBreakfastRecipeNum += edamamRecipesPerPage;
		edamamMinBreakfastRecipeNum += edamamRecipesPerPage;
		displayEdamamResults(edamamBreakfastData, "Breakfast", edamamMinBreakfastRecipeNum, edamamMaxBreakfastRecipeNum);
	});
}

function edamamPrevPageBreakfastClick() {
	$('#js-edamam-breakfast-results').on('click', '#js-edamam-prev-page-breakfast', function (event) {
		edamamMinBreakfastRecipeNum -= edamamRecipesPerPage;
		edamamMaxBreakfastRecipeNum -= edamamRecipesPerPage;
		if(edamamMinBreakfastRecipeNum < 0) {
			edamamMinBreakfastRecipeNum = 0;
		}
		displayEdamamResults(edamamBreakfastData, "Breakfast", edamamMinBreakfastRecipeNum, edamamMaxBreakfastRecipeNum);
	});
}

function edamamNextPageLunchClick() {
	$('#js-edamam-lunch-results').on('click', '#js-edamam-next-page-lunch', function (event) {		
		edamamMinLunchRecipeNum += edamamRecipesPerPage;
		edamamMaxLunchRecipeNum += edamamRecipesPerPage;
		displayEdamamResults(edamamLunchData, "Lunch", edamamMinLunchRecipeNum, edamamMaxLunchRecipeNum);
	});
}

function edamamPrevPageLunchClick() {
	$('#js-edamam-lunch-results').on('click', '#js-edamam-prev-page-lunch', function (event) {		
		edamamMinLunchRecipeNum -= edamamRecipesPerPage;
		edamamMaxLunchRecipeNum -= edamamRecipesPerPage;
		if(edamamMinLunchRecipeNum < 0) {
			edamamMinLunchRecipeNum = 0;
		}
		displayEdamamResults(edamamLunchData, "Lunch", edamamMinLunchRecipeNum, edamamMaxLunchRecipeNum);
	});
}

function edamamNextPageDinnerClick() {
	$('#js-edamam-dinner-results').on('click', '#js-edamam-next-page-dinner', function (event) {
		edamamMinDinnerRecipeNum += edamamRecipesPerPage;
		edamamMaxDinnerRecipeNum += edamamRecipesPerPage;
		displayEdamamResults(edamamDinnerData, "Dinner", edamamMinDinnerRecipeNum, edamamMaxDinnerRecipeNum);
	});
}

function edamamPrevPageDinnerClick() {
	$('#js-edamam-dinner-results').on('click', '#js-edamam-prev-page-dinner', function (event) {		
		edamamMinDinnerRecipeNum -= edamamRecipesPerPage;
		edamamMaxDinnerRecipeNum -= edamamRecipesPerPage;
		if(edamamMinDinnerRecipeNum < 0) {
			edamamMinDinnerRecipeNum = 0;
		}
		displayEdamamResults(edamamDinnerData, "Dinner", edamamMinDinnerRecipeNum, edamamMaxDinnerRecipeNum);
	});
}

function searchSubmit() {
	$('.js-search-form').submit(event => {
		event.preventDefault();
		let minCaloriesPerMeal = defaultMinCalories;
		let maxCaloriesPerMeal = defaultMaxCalories;

		// Fetch all the the data from the form
		var fields = $("form").serializeArray();

		// Remove previous results from the page
		$('.js-edamam-results').empty();
		$('.js-youtube-results').empty();
		// Update 'searchQuery' with the values from the form
		jQuery.each(fields, function (i, field) {
			switch (field.name) {
				case "breakfast-query":
					searchQuery.breakfastQuery = field.value;
				break;
				case "lunch-query":
					searchQuery.lunchQuery = field.value;
				break;
				case "dinner-query":
					searchQuery.dinnerQuery = field.value;
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
						minCaloriesPerMeal = field.value;
					}
				break;
				case "calories-max":
					if (field.value) {
						maxCaloriesPerMeal = field.value;
					}
				break;
			}
		});

		if((searchQuery.breakfastQuery.length === 0) && (searchQuery.lunchQuery.length === 0) && 	(searchQuery.dinnerQuery.length === 0)) {
			alert("Sorry, we can't help you if you don't tell us what you want to eat. Please enter preferences for at least one meal (i.e. Breakfast, Lunch, or Dinner).");
			return;
		}

		// After fetching data from the form, validate min and max calories and update the system
		if (parseInt(maxCaloriesPerMeal) <= parseInt(minCaloriesPerMeal)) {
			alert("Max calories should be higher than Min calories!");
			return;
		}
		searchQuery.calories = minCaloriesPerMeal + '-' + maxCaloriesPerMeal;

		//$( "div" ).hide( "drop", { direction: "down" }, "slow" );
		$('.search-container').slideUp("slow");
		$('#search-again-button').show();

		if (searchQuery.breakfastQuery) {
			searchQuery.query = searchQuery.breakfastQuery;
			getEdamamRecipes(searchQuery, displayEdamamBreakfastResults, "Breakfast");
			getYouTubeDataFromApi(searchQuery.query, displayYouTubeBreakfastResults);
		}
		if (searchQuery.lunchQuery){
			searchQuery.query = searchQuery.lunchQuery;
			getEdamamRecipes(searchQuery, displayEdamamLunchResults, "Lunch");
			getYouTubeDataFromApi(searchQuery.query, displayYouTubeLunchResults);
		}
		if (searchQuery.dinnerQuery) {
			searchQuery.query = searchQuery.dinnerQuery;
			getEdamamRecipes(searchQuery, displayEdamamDinnerResults, "Dinner");
			getYouTubeDataFromApi(searchQuery.query, displayYouTubeDinnerResults);
		}
	});
}

function handleYoutubeSearch() {
	searchSubmit();
	youtubeThumbnailClick();
	youtubeThumbnailKeyup();
	edamamThumbnailClick();
	edamamThumbnailKeyup();
	youTubeNextPageBreakfastClick();
	youTubePrevPageBreakfastClick();
	youTubeNextPageLunchClick();
	youTubePrevPageLunchClick();
	youTubeNextPageDinnerClick();
	youTubePrevPageDinnerClick();
	edamamNextPageBreakfastClick();
	edamamPrevPageBreakfastClick();
	edamamNextPageLunchClick();
	edamamPrevPageLunchClick();
	edamamNextPageDinnerClick();
	edamamPrevPageDinnerClick();
	closeModalClick();
	closeModalDocClick();
	closeModalKeyupClick();
	searchAgainButtonClick();
	clearSearchFieldsClick();
	//searchBoxTyping();
}

$(handleYoutubeSearch);
