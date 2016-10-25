if (typeof navigator.share === 'function') {
    var shareLinks = document.querySelectorAll('a[href^="https://twitter.com/intent/tweet"');

    [].forEach.call(shareLinks, function (anchor) {
        anchor.textContent = 'Share this';

        anchor.addEventListener('click', function (e) {
            var text = decodeURIComponent(anchor.href.split('?').pop().split('&').shift().split('=').pop());
            navigator.share({
                title: document.title,
                text: text,
                url: document.querySelector('link[rel=canonical]') ? document.querySelector('link[rel=canonical]').href : window.location.href
            })

            e.preventDefault();
        });
    });
}
