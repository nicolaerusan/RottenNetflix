var TESTING = true;

var ROOT_URL = "http://netflixrottenizer.appspot.com/yelp/";
if (TESTING) ROOT_URL = "http://localhost:11090/yelp";

var user_address = $('#Address').find(':selected').text();

$('#VendorsTable').find('tr').each(function() {
    var $this = $(this);
    var restaurant = $this.find('h3 .tooltip-header').text().replace(/[^\w\s]/gi, ''); // get rid of special characters
    
    var $ratingCell = $this.find('td:nth-child(4)')

    var url = ROOT_URL + '?term=' + restaurant + '&location=' + user_address + '&limit=1'
    console.log(url)
    $.getJSON(url).
        success(function(data) {
            if(!data.error) {
                console.log(data);
                var restaurant = data.businesses[0];

                var smelp_rating = $(
                        '<div class="smelp-rating">' +
                            '<a href="' + restaurant.url + '">' + restaurant.rating  + '</a>' +
                        '</div>'
                    );
                $ratingCell.append(smelp_rating);    
            }
        })
    ;
});



