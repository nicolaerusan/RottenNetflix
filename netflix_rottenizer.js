var TESTING = false;
var hideRotten = false;
var show_all = true;
var show_highly_rated = false;
var serverIsServing = true;
var serverPings = 0;
var use_local_storage = true;
var local_data = [];

var ROOT_URL = "http://netflixrottenizer.appspot.com/netflix";
if (TESTING) ROOT_URL = "http://localhost:9080/netflix";


var bindElement = ".slider-item";


// ------------------ ON DOM LOAD ---------------------


$(function() {

   $('.slider-item').on('mouseover', _.throttle(hoverMovie, 500));
   

   
});

chrome.storage.local.remove('rotten_data');

chrome.storage.local.get('rotten_data', function(data) {
    if (data.rotten_data) {
        local_data = data.rotten_data
    }
});


// ------------------ Add RT Ratings to Movies ---------------------

function hoverMovie() {
    var $this = $(this);
    setTimeout(function() {
        var movieTitle = $this.find('.bob-title').html();
        
        if (movieTitle) {
            handleMovie($this, movieTitle);
        }
    }, 500);
}


function handleMovie($el, movieTitle) {
    var hit_the_server = true;
    var RTData = {};
    var movieUrl = convertTitleToUrl(movieTitle);
        
    
    // make sure its a movie and hasnt already been polled
    if (!$el.hasClass('netflix-rottenizer-polled') && movieTitle) {
        
        console.log('ok1')

        if ($el.children('.rt_rating').length < 1) {
            
            console.log('ok2')

            // check to see if we have it in local storage
            if (use_local_storage) {
                for (var j = 0; j < local_data.length; j++) {
                    if(_.contains(local_data[j], movieTitle)) {
                        RTData = local_data[j];
                        addRTRatings($el.find('.bob-card'), RTData);
                        hit_the_server = false;
                        break;
                    } 
                }
            }

            console.log('ok3')

            if(serverIsServing && hit_the_server) {
                serverPings += 1;
                
                console.log('ok4')
                $.getJSON(movieUrl).
                    success(function(data) {       

                        console.log(data);


                        // We have info from RT
                        if (data.movies && data.movies.length > 0) {
                            var rating = data.movies[0].ratings.critics_score;
                            var audience_rating = data.movies[0].ratings.audience_score;
                            var rtLink = data.movies[0].links.alternate;

                            RTData = {
                                'movie': movieTitle,
                                'rating': rating,
                                'audience_rating': audience_rating,
                                'rtLink': rtLink
                            };

                            addRTRatings($el.find('.bob-card'), RTData);
                            serverIsServing = true;
                        
                        // We don't have info
                        } else {
                            RTData = {
                                'movie': movieTitle,
                                'rating': 'n/a',
                                'audience_rating': 'n/a',
                            };
                        }

                        // If we dont have the movie in local storage, add it
                        if (use_local_storage) {
                            if(!_.contains(local_data, movieTitle)) {
                                local_data.push(RTData);
                                chrome.storage.local.set({rotten_data: local_data})
                            }
                        }

                        // Mark the element as polled
                        $el.addClass('netflix-rottenizer-polled');
                        console.log($this);
                    }).
                    
                    error(function(error) {
                        console.log(error);
                        console.warn('Server problem');
                        //serverIsServing = false;    
                        
                    })
                ;
            }
        }
    }
}


function addRTRatings($element, data) {
    var $el = $element
    ,   $movieLink = $el.find('a')
    ,   $parentEl = $el.parent()
    ,   $parentElClass = $parentEl.attr('class')

    var audienceClass = 'na';
    var ratingClass = 'na';

    if (data.rating > 59) {
        ratingClass = 'fresh';
    } else if (data.rating > 0) {
        ratingClass = 'rotten';
    } else if (data.rating ==='n/a') {
        ratingClass = 'na';
    }

    if (data.audience_rating > 59) {
        audienceClass = 'fresh';
    } else if (data.audience_rating > 0) {
        audienceClass = 'rotten';
    } else if (data.audience_rating ==='n/a'){
        audienceClass = 'na';
    } 

    $parentEl
        .addClass(ratingClass)
        .data('RTrating', data.rating);


    var $ratingEl = $(
        "<a target='_blank' href='" + data.rtLink + "' class='rt_rating'>" +
        "<div class='icon rt_" + ratingClass + "'></div><span class='critics_score " + ratingClass + "''>" + data.rating + "%</span>" +
        "<div class='icon audience rt_" + audienceClass + "'></div><span class='audience_score percent "+audienceClass+"'>" + data.audience_rating + "%</span>" + "</a>"
    );

    if (data.rating !== 'n/a' || data.audience_rating !== 'n/a' )
    $el.append($ratingEl);

    $ratingEl.hide().fadeIn(500);
}



// ------------------ Sanitation Functions ---------------------
function convertTitleToUrl(title) {
    var rtUrl = ROOT_URL;
    var title = encodeURI(title);
    title = removeSubtitles(title);
    title = replaceAmpersands(title);
    title = removeExtraneousCharacters(title);
    title = title.toLowerCase();
    title = removeLeadingArticle(title);
    title = replaceAccentedLetters(title);
    rtUrl += "?q=" + title + "&page_limit=1";
    return rtUrl;
}

function removeSubtitles(title) {
    return title.replace(/(: Collector's Series|: Collector's Edition|: Director's Cut|: Special Edition)/, "");
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

function getURLParameter(name, url) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(url) || [, ""])[1].replace(/\+/g, '%20')) || null;
}

// ------------------ isONScreen ---------------------
// Jquery Plugin -- calculates whether an element is currently displayed in the viewport
$.fn.isOnScreen = function() {
    var win = $(window);
    var viewport = {
        top: win.scrollTop(),
        left: win.scrollLeft()
    };

    viewport.right = viewport.left + win.width();
    viewport.bottom = viewport.top + win.height();

    var bounds = this.offset();
    bounds.right = bounds.left + this.outerWidth();
    bounds.bottom = bounds.top + this.outerHeight();

    return (!(viewport.right < bounds.left || viewport.left > bounds.right || viewport.bottom < bounds.top || viewport.top > bounds.bottom));
};

// ------------------ Google Analytics ---------------------
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-47202933-1']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

