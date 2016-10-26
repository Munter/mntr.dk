if (typeof navigator.share === 'function') {
    var shareLinks = document.querySelectorAll('a[href^="https://twitter.com/intent/tweet"');

    [].forEach.call(shareLinks, function (anchor) {
        anchor.textContent = 'Share this';

        anchor.addEventListener('click', function (e) {
            var queryParams = anchor.href.split('?').pop().split('&').reduce(function (prev, string) {
                var pair = string.split('=');

                prev[pair[1]] = decodeURIComponent(pair[2]).replace('+', ''); // Jekyll cgi_escape adds '+' instead or '%20'
            }, {});

            navigator.share({
                title: queryParams.title,
                text: queryParams.text,
                url: queryParams.url
            })

            e.preventDefault();
        });
    });
}
