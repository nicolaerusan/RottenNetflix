var apiKey = "9udjy8ah39qedyb6eb6rd4p6"; // not used, but could use as a fallback.
var bindElement; // depending on the page, append the rotten tomatoes info to different elem.

$.fn.isOnScreen = function(){
    
    var win = $(window);
    
    var viewport = {
        top : win.scrollTop(),
        left : win.scrollLeft()
    };
    viewport.right = viewport.left + win.width();
    viewport.bottom = viewport.top + win.height();
    
    var bounds = this.offset();
    bounds.right = bounds.left + this.outerWidth();
    bounds.bottom = bounds.top + this.outerHeight();
    
    return (!(viewport.right < bounds.left || viewport.left > bounds.right || viewport.bottom < bounds.top || viewport.top > bounds.bottom));
    
};

function convertTitleToUrl(title) {
  var rtUrl = "http://api.rottentomatoes.com/api/public/v1.0/movies.json?apikey=" +apiKey;
  title = encodeURI(title);
  title = removeSubtitles(title);
  // title = title.toLowerCase();
  // title = replaceWordSeparators(title);
  title = replaceAmpersands(title);
  title = removeExtraneousCharacters(title);
  title = removeLeadingArticle(title);
  title = replaceAccentedLetters(title);
  rtUrl += "&q=" + title + "&page_limit=1";
  console.log(rtUrl);
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
        var $parentEl = $(this).parent();
        var $parentElClass = $parentEl.attr('class');

        if ($parentEl.isOnScreen()) {

            //make sure its a movie and hasnt been polled
            if (!$parentElClass.match('TV') && !$parentEl.hasClass('polled')) {
            
                var bindElementTemp = imageEl.closest(bindElement);
                
                if (bindElementTemp.children('.rt_rating').length < 1) {     
                    var movieTitle = imageEl.attr('alt');
                    var movieUrl = convertTitleToUrl(movieTitle)
                    
                    $.ajax({
                        url: movieUrl,
                        dataType: 'json',
                        type: 'GET',
                        success:function(data){
                            console.log(data.movies.length);
                            if (data.movies.length > 0) {
                                var rating = data.movies[0].ratings.critics_score;
                                if (rating > 70) {
                                    var $ratingEl = $("<a href='"+ movieUrl +"' class='rt_rating rt_fresh'><div class='icon'></div>"+ rating +"</a>");
                                    bindElementTemp.append($ratingEl);
                                    $ratingEl.hide().fadeIn(1000);
                                } else if (rating > 0){
                                    var $ratingEl = $("<a href='"+ movieUrl +"' class='rt_rating rt_rotten'><div class='icon'></div>"+ rating +"</a>");
                                    bindElementTemp.append($ratingEl);
                                    $ratingEl.hide().fadeIn(1000);
                                }
                            }
                        }
                    });
                    $parentEl.addClass('polled');
                } 
            }
        };
    });
};

$(function(){
    
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

    window.setInterval(computeRatings, 2000);
    
    
    // handle lazy loading of moviesactivated by click on next arrows for Suggested page.   
    $('.qSlider-navNext, qSlider-navNext').click(function(){
        computeRatings();
    });
    
    
});
