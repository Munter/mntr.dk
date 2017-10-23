if (typeof navigator.share === 'function') {
    var shareLinks = document.querySelectorAll('a[href^="https://twitter.com/intent/tweet"');

    [].forEach.call(shareLinks, function (anchor) {
        anchor.textContent = 'Share this';

        anchor.addEventListener('click', function (e) {
            var url = new URL(anchor.href);

            navigator.share({
                title: url.searchParams.get('title'),
                text: url.searchParams.get('text'),
                url: url.searchParams.get('url')
            })

            e.preventDefault();
        });
    });
}
