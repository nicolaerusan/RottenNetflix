var TESTING = false
,   hideRotten = false
,   show_all = true
,   show_highly_rated = false
,   serverIsServing = true
,   bindElement
,   serverPings = 0
,   use_local_storage = true
,   local_data = []

,   ROOT_URL = "http://netflixrottenizer.appspot.com/netflix";
if (TESTING) ROOT_URL = "http://localhost:9080/netflix";


// ------------------ ON DOM LOAD ---------------------
$(function() {

    // depending on the page, append the rotten tomatoes info to different elems.
    // switch ($('body').attr('id')) {
    //     case 'page-WiHome':
    //         bindElement = '.boxShot';
    //         break;

    //     case 'page-WiAltGenre':
    //         bindElement = '.boxShot';
    //         break;

    //     case 'page-WiMovie':
    //         bindElement = '.agMovie';
    //         break;

    //     case 'page-RecommendationsHome':
    //         bindElement = '.agMovie';
    //         break;

    //     default:
    //         bindElement = '.boxShot';
    //         break;
    // }

    
    computeRatings(); // Initializes Rotten Tomato Ratings
    
    
    // $(document).on('scroll', function(evt) {
    //     if ($(window).scrollTop() % 200 === 0) {
    //         computeRatings();
    //     }
    // });
    

    // // handle lazy loading of moviesactivated by click on next arrows for Suggested page.
    // $('.qSlider-navNext, qSlider-navNext').click(function() {
    //     computeRatings();
    // });
});

chrome.storage.local.get('rotten_data', function(data) {
    if (data.rotten_data) {
        local_data = data.rotten_data
    }
});


// ------------------ Add RT Ratings to Movies ---------------------
function computeRatings() {

    $('.slider-item').each(function() {
        var $this = $(this);
        // ,   $movieLink = $this.find('a')
        // ,   $parentEl = $this.parent()
        // ,   $parentElClass = $parentEl.attr('class')
        // ,   bindElementTemp = $movieLink.closest(bindElement)




            
        var RTData = {};

        var hit_the_server = true;

        //only poll rotten tomatoes if the element is on screen
        if ($this.isOnScreen()) {
            
            $this.hoverIntent({
                over: onMouseOverMovie,
                out: onMouseOutMovie
            });


            var onMouseOverMovie = function() {
                if ($this.children('.rt_rating').length > 0) {
                    setTimeout(function() {
                        $this.children('.rt_rating').fadeOut();
                    }, 200);
                }
            };

            var onMouseOutMovie = function() {
                if ($this.children('.rt_rating').length > 0) {
                    setTimeout(function() {
                        if($this.children('.bob-card').length < 1) {
                            $this.children('.rt_rating').fadeIn();
                        }
                    }, 200);    
                }
            };

            var movieTitle = $this.find('[aria-label]').attr('aria-label');
            var movieUrl = convertTitleToUrl(movieTitle);

            
            //make sure its a movie and hasnt already been polled

            if (!$this.hasClass('polled')) {
                if ($this.children('.rt_rating').length < 1) {
                    
                    // check to see if we have it in local storage
                    if (use_local_storage) {
                        for (var j = 0; j < local_data.length; j++) {
                            if(_.contains(local_data[j], movieTitle)) {
                                RTData = local_data[j];
                                addRTRatings($this, RTData);
                                hit_the_server = false;
                                break;
                            } 
                        }
                    }

                    if(serverIsServing && hit_the_server) {
                        serverPings += 1;
                        
                        $.getJSON(movieUrl).
                            success(function(data) {          

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

                                    addRTRatings($this, RTData)
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
                                $this.addClass('polled');
                            }).
                            
                            error(function(error) {
                                if (error.status !== 200) {
                                    console.log(error);
                                    console.warn('Server problem');
                                    //serverIsServing = false;    
                                }
                            })
                        ;
                    }
                }
            }
        }
    });
    
    setTimeout(function() { computeRatings(); }, 3000);
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

