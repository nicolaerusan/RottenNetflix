var apiKey = "9udjy8ah39qedyb6eb6rd4p6"; // not used, but could use as a fallback.
var bindElement; // depending on the page, append the rotten tomatoes info to different elem.

function convertTitleToUrl(title) {
  var rtUrl = "http://www.rottentomatoes.com/m/";
  title = removeSubtitles(title);
  title = title.toLowerCase();
  title = replaceWordSeparators(title);
  title = replaceAmpersands(title);
  title = removeExtraneousCharacters(title);
  title = removeLeadingArticle(title);
  title = replaceAccentedLetters(title);
  rtUrl += title + "/";
  return rtUrl;
}

function removeSubtitles(title) {
  return title.replace(/(: Collector's Series|: Collector's Edition|: Director's Cut|: Special Edition)/, "");
}


function replaceWordSeparators(title) {
  return title.replace(/( |-)/g, "_");
}


function replaceAmpersands(title) {
  return title.replace(/&/g, "and");
}


function removeExtraneousCharacters(title) {
  return title.replace(/('|,|\.|!|\?|\/|:|\[|\]|\(|\))/g, "");
}


function removeLeadingArticle(title) {
  return title.replace(/^(the|a|an)_/, "");
}


function replaceAccentedLetters(title) {
  return title.replace(/(é|è)/g, "e");
}


function deSrcHTML(html) {
  return html.replace(/src/g, "foo");
}

var idToElem = {} // need this for message passing. Holds a matched #numericalID in order of apperance on page => element 
var idToMovieUrl = {}

function computeRatings(){
	$('.boxShot').each(function(index, element){
		
		var imageEl = $(this).find('.boxShotImg');
		
		var bindElementTemp = imageEl.closest(bindElement);
		if (bindElementTemp.children('.rt_rating').length < 1){		
			var movieTitle = imageEl.attr('alt');
			var movieUrl = convertTitleToUrl(movieTitle)
// 			
			idToElem[index] = bindElementTemp;
			idToMovieUrl[index]  = movieUrl;
			
			var passedObject = {
				index: index,
				movieUrl: movieUrl				
			}

			safari.self.tab.dispatchMessage("getRottenRating", passedObject);

		}
	});
};

// Have to use global.html due to Cross Origin restrictions.
// So proxy through that.
function getRatingFromGlobal(msgEvent){
	
	var index = msgEvent.message['index'];
	var rating = msgEvent.message['rating'];
	if(rating > 70){
		idToElem[index].append("<a href='"+ idToMovieUrl[index]  +"' class='rt_rating rt_fresh'><div class='icon'></div>"+ rating +"</a>")
	}
	else{
		idToElem[index].append("<a href='"+ idToMovieUrl[index] +"' class='rt_rating rt_rotten'><div class='icon'></div>"+ rating +"</a>")
	}
}

$(document).ready(function(){
	
	switch($('body').attr('id')){
		case 'page-WiHome':
			bindElement = '.boxShot';
		break;
			
		case 'page-WiAltGenre':
			bindElement = '.boxShot';
		break;
		
		case 'page-WiMovie':
			bindElement = '.agMovie'; 
		break;
		
		case 'page-RecommendationsHome':
			bindElement = '.agMovie'; 
		break;
		
		default:
			bindElement = '.boxShot';
		break;
	}
	
	computeRatings();
	
	// handle lazy loading of moviesactivated by click on next arrows for Suggested page.	
	$('.qSlider-navNext, qSlider-navNext').click(function(){
		computeRatings();
	});
	
	safari.self.addEventListener("message", getRatingFromGlobal, false);
});
