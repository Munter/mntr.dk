---
layout: post
title:  "Webfont optimization with subfont"
date:   2018-12-10 17:41:11
twittertext: What if you could have a single tool fully automate your webfont subsettign and load strategy? Now you can!
categories: browser webfont performance subset preload
---

This is a performance measurement post that investigates the performance gains, if any, that the [subfont](https://www.npmjs.com/package/subfont) tool can provide for statically built pages that run a default web font loading setup from a font service like Google fonts or Adobe Typekit.

Webfonts have a horrible loading profile, where the fonts won't be requested until the browser has been through a full HTML and CSS load and is ready to render for the first time. Only then are fonts loaded from the server. This incremental discovery and load pattern greatly delays text rendering or causes flashes of invisible or unstyled text. Subfont was created to fully automate the techniques that can be used to avoid this undesirable loading profile.

TLDR; There is literally no downside to using subfont to improve your font loading.




## Techniques used by subfont

Subfont applies multiple font loading and optimization techniques in order to both improve the load profile and at the same time hit a very wider browser support range.


### Preload

`<link rel="preload">` is by far the biggest win of the techniques applied. My best guess is that 80-90% of the speed gains come from this single technique. Sadly the browser support is only at around 60% of global usage according to [caniuse.com](https://caniuse.com/#search=preload).

### Javascript Preload

In order to increase the browser range that can load fonts before the first render, we can take advantage of the `FontFace` interface. We can instantiate a Javascript instance of a font with `var font = new FontFace(name, URL, properties)` and then call `font.load()` for an immediate download of the font by the browser. If this is done as soon as the browser starts parsing the HTML, the fonts will start downloading much earlier than they would otherwise. This is the same technique used by [Font Face Observer](https://fontfaceobserver.com/)

### Serving fonts locally

Instead of incurring extra latency costs by looking up external font services DNS records, do extra TLS handshakes and wait for TCP slow start on these new connections, subfont moves all your fonts to your own code base and serves them from your own server. If you serve your site with http2 you should skip extra connection establishing costs.

### Content-addressable file naming

Also known as file hashing, this technique names the files with a hash of their content. While it's not a font loading mechanism that really makes any difference on the first load, if you set your caching headers right, the font might never have to be downloaded on the second page load or on a page navigation. Subfont automatically handles this for you.

### Subsetting of fonts

The holy grail of font loading is only loading exactly what you need. The theory is simple. Use a font subsetting tool to create a new version of your font that only includes the exact glyphs you need and nothing more. This can reduce the payload of each font significantly.

There are some major problems that arise when you start working on this though:

#### How do I know what glyphs I need?

Knowing what you need in each font variant is extremely difficult. You could just take all the text from your page or your database, but all of those characters are probably not needed in your headings. And even so, there is text that appears on a page that is actually not in your HTML source. Characters are shown for list-counters, quotations, input values, CSS `content` attributes. There is `text-transform` that will change what you think you have in your source, CSS transitions and animations that will animate over `font-weight` and suddenly leak characters into other variants. There are pseudo classes and pseudo elements, media queries which can have the same text be in multiple font variants.

In short, it's not simple. It's not something you want to try and deal with yourself. So we did it for you in subfont. Subfont takes care of all of the above scenarios and more. This is done based on static analysis of your pages and running what is essentially a multidimensional `getComputedStyle` for all types of characters that might appear on a page.

This also means the tool is limited to static pages, app shells or similar. If you do single page applications in javascript you might still be able to take advantage of it by pre-rendering your pages to be static.

#### What if the subset is missing glyphs?

If a subset is missing glyphs and you fall back to a generic font like `sans-serif` or any other generic font-family, your result will be quite bad. You might see things that look like a ransom letter where glyphs are missing. Subfont can't know about dynamic content that appears at runtime. Things like javascript adding content or even a user typing in a textbox can hit missing glyphs in your subset.

In order to handle this problem subfont actually keeps your original fonts around and creates a completely new font with the subset you need. It then prepends this new font subset before your original font name in all places where you use it. So if you have `font-family: Roboto, sans-serif;` in your input, your output might be `font-family: Roboto__subset, Roboto, sans-serif;`. This technique takes advantage of the font fallback algorithm that states that browsers should apply the first font in the `font-family` order, but fall through to the next one if glyphs are missing. This means that your original webfont will be loaded in case of missing glyphs.

This fallback mechanism ensures correct glyphs, albeit possibly loaded with a bit of delay because it happens on demand when new glyphs pop into the page.

#### Injecting the new subset into the pages

It sounds simple to just replace the original font with the subset. But as stated above you probably need both the subset and the original to keep a safe fallback. And with all the preloading techniques mentioned above, the amount of places you have to update to point at your newly generated font files is daunting and error-prone. As a lazy engineer, I would always want robots to handle this or me. And subfont does just that.



## Before and after comparisons

I ran a [webpagetest.org](https://webpagetest.org) comparison of my blog before and after the application of [subfont](https://www.npmjs.com/package/subfont). The baseline is my currently deployed version of my blog, where I load web fonts using Google fonts with their recommended CSS. The subfont variant in the below comparisons is the baseline blog code with Google font loading, but with subfont applied as part of the build pipeline.

I have focused on slow network connections because I assume the biggest gains from subsetting and loading fonts optimally come on slower and higher latency connections. I did a single speed comparison on a cabled connection, just to make sure it wouldn't yield completely different results.

I've chosen to present the timeline, the visual progress graph, and the comparison video. If you are interested in looking into each test detail you can click the heading, which links to the individual test comparison. Find your waterfall charts there.



### [Moto 4g - Chrome - 3g Slow](https://www.webpagetest.org/video/compare.php?tests=171210_V9_b34eacaf5475e5202ee1e2ccbe81aabf,171210_Y5_6596b18e26990df98710dd32ad2bf7ad)

The subfont variant has its first paint at ~3s compared to the baseline at ~4.5s. The subfont variant renders full web fonts at the ~3s mark while the baseline doesn't have fonts rendered until ~6.5s.

![timeline snapshots](/assets/2017-subfont/moto4g-chrome-3gslow/timeline.png)
![graph: visually completeness percentage over time](/assets/2017-subfont/moto4g-chrome-3gslow/visual-progress.png?trim)
<video src="/assets/2017-subfont/moto4g-chrome-3gslow/video.mp4" controls playsinline></video>


### [Desktop - Chrome - 3g Slow](https://www.webpagetest.org/video/compare.php?tests=171210_VE_baf0a2de69cb883990370f2bbb8b440b,171210_5F_2b8fc47ca2c9940b04cf29d4820ba4c9)

First paint happens at ~4.5s for the baseline and around ~2.5s for the subfont variant. Both render text in their first paint

![timeline snapshots](/assets/2017-subfont/chrome-3gslow/timeline.png)
![graph: visually completeness percentage over time](/assets/2017-subfont/chrome-3gslow/visual-progress.png?trim)
<video src="/assets/2017-subfont/chrome-3gslow/video.mp4" controls playsinline></video>


### [Desktop - Firefox - 3g Slow](https://www.webpagetest.org/video/compare.php?tests=171210_HE_777d38cc84e5e016911de58819580dc1,171209_PS_caf0fcfe02cf3432b3278a5ff75d4e3b)

The baseline has its first paint at around ~6.5s with no text content. First text content starts showing at ~9s and the last font loads at around ~10s.

The subfont variant has its first paint at ~4.5s with only headlines showing. Fonts drop in over the next 2 seconds and visually complete at ~6s.

The subfont variant is visually complete before the baseline even has its first paint!

![timeline snapshots](/assets/2017-subfont/firefox-3gslow/timeline.png)
![graph: visually completeness percentage over time](/assets/2017-subfont/firefox-3gslow/visual-progress.png?trim)
<video src="/assets/2017-subfont/firefox-3gslow/video.mp4" controls playsinline></video>


### [Dekstop - Microsoft Edge - 3g Slow](https://www.webpagetest.org/video/compare.php?tests=171210_22_e24d31eedffe2f461150ff9c22ae06e1,171210_ZG_5e44a66e974b62a9952c730debbbc2db)

The baseline has its first paint at ~8.5s with readable text but doesn't hit visual completeness until ~12.5s.

The subfont variant has its first paint at ~5s with text and is visually complete at ~6s.

Subfont beats the baseline with visual completeness 2.5s before the first paint even happens on the baseline!

I think the big difference is due to the oddly long SSL handshakes that can be seen on the waterfall chart. The baseline has to do SSL handshakes for fonts.google.com and fonts.gstatic.com incrementally, which is quite slow.

Edge seems to download the original Google fonts in the subfont variant as well. These were supposed to only serve as a fallback for missing glyphs in the font subsets. Why Edge loads the original fonts is unclear to me. Might be a bug in their loading code. Despite the final download size being larger in the subfont variant, due to these extra downloads, subfont beats the baseline by multiple seconds.

![timeline snapshots](/assets/2017-subfont/edge-3gslow/timeline.png)
![graph: visually completeness percentage over time](/assets/2017-subfont/edge-3gslow/visual-progress.png?trim)
<video src="/assets/2017-subfont/edge-3gslow/video.mp4" controls playsinline></video>


### [Dekstop - IE11 - 3g Slow](https://www.webpagetest.org/video/compare.php?tests=171210_1T_ea8ca0d3b1d5be31121ecac216c9cd53,171210_N9_2f1146df0a58495cedb48acc31a43601)

The baseline has its first paint at ~5s with fallback fonts and the Google fonts trickle in very late at around ~7.5s where the text jumps around a few times until visual completeness at ~9.5s.

The subfont variant first paints at ~4s and is visually complete at ~6s, beating the baseline by a wide margin.

The waterfall for the subfont variant shows that something is completely off the charts wrong in the way IE11 loads fonts. First, it downloads the woff2 subset fonts provided by subfont. Then it loads the woff versions of the subsets provided by subfont. Then it continues to also download the original Google fonts, bumping the font payload up way above what the baseline loads.

![timeline snapshots](/assets/2017-subfont/ie11-3gslow/timeline.png)
![graph: visually completeness percentage over time](/assets/2017-subfont/ie11-3gslow/visual-progress.png?trim)
<video src="/assets/2017-subfont/ie11-3gslow/video.mp4" controls playsinline></video>


### [Dekstop - IE10 - 3g Slow](https://www.webpagetest.org/video/compare.php?tests=171210_7Y_b1004a7e44789985e9c088a1dc54bab7%2C171209_CG_cf3a1fe72fa4acc388f68ea64ef7db8b&thumbSize=200&ival=500&end=visual)

The baseline has its first paint at ~5s with fallback text. Google fonts start popping in at ~10s and visual completeness is achieved at ~11s.

The subfont variant has its first paint at ~4s and is visually complete at ~5.5s.

IE10 also loads the Google fonts in the subfont variant, but they have no impact on visual completeness. Just wasted bandwidth.

![timeline snapshots](/assets/2017-subfont/ie10-3gslow/timeline.png)
![graph: visually completeness percentage over time](/assets/2017-subfont/ie10-3gslow/visual-progress.png?trim)
<video src="/assets/2017-subfont/ie10-3gslow/video.mp4" controls playsinline></video>


### [Dekstop - IE9 - 3g Slow](https://www.webpagetest.org/video/compare.php?tests=171210_67_eeda201dcc832f4b5e7da5ab6d26442a%2C171210_HV_57d313a9d6a7b72f735f2b9f2e4189c9)

The baseline has its first paint at ~5s with fallback text. Google fonts start popping in at ~8.5s and visual completeness is achieved at ~10.5s.

The subfont variant has its first paint at ~3.5s and is visually complete at ~5.5s.

IE9 also loads the Google fonts in the subfont variant, but they have no impact on visual completeness

![timeline snapshots](/assets/2017-subfont/ie9-3gslow/timeline.png)
![graph: visually completeness percentage over time](/assets/2017-subfont/ie9-3gslow/visual-progress.png?trim)
<video src="/assets/2017-subfont/ie9-3gslow/video.mp4" controls playsinline></video>


### [Desktop - Chrome - Cable connection](https://www.webpagetest.org/video/compare.php?tests=171210_50_c236a29f2cc59386771a28ceb9de99ed,171210_9N_aceb616e1077204a8cce193bf11160c9)

On a cable connection and a desktop machine things happen quite a bit faster.

The baseline has its first paint with no texts at ~0.8s and is visually complete with fonts at ~1s.

The subfont variant has one single paint at 0.6s and is immediately visually complete.

![timeline snapshots](/assets/2017-subfont/chrome-cable/timeline.png)
![graph: visually completeness percentage over time](/assets/2017-subfont/chrome-cable/visual-progress.png?trim)
<video src="/assets/2017-subfont/chrome-cable/video.mp4" controls playsinline></video>
