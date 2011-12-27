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

function computeRatings(){
	$('.boxShot').each(function(){
		
		var imageEl = $(this).find('.boxShotImg');
		
		var bindElementTemp = imageEl.closest(bindElement);
		if (bindElementTemp.children('.rt_rating').length < 1){		
			var movieTitle = imageEl.attr('alt');
			var movieUrl = convertTitleToUrl(movieTitle)
			
			$.ajax({
				url: movieUrl,
				dataType: 'html',
				success:function(data){
					var rating = $('#all-critics-meter', data).html();
					
					if(bindElementTemp.children('videoAnnotation').length > 1)
					
					if(rating > 70){
						bindElementTemp.append("<a href='"+ movieUrl +"' class='rt_rating rt_fresh'><div class='icon'></div>"+ rating +"</a>")
		  			}
		  			else{
		  				bindElementTemp.append("<a href='"+ movieUrl +"' class='rt_rating rt_rotten'><div class='icon'></div>"+ rating +"</a>")
		  			}
				}
			});
		}
	});
};

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
	
	
});
