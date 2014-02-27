---
layout: post
title:  "PUSH, the post GET paradigm"
date:   2014-02-27 19:15:29
categories: web development performance assetgraph spdy http2
---

# PUSH, the post GET paradigm

Web performance these days is non-optional. If your web page is slow you lose business. Our visitors are an impatient lot, and though they are not actively counting milliseconds, web developers have to, just in order to keep their thoughts from cat videos and flappy bird.

In our hunt for milliseconds we, the web developers, are going to a great ordeal just to keep up. We are following [the 14 rules](http://stevesouders.com/hpws/rules.php), we are fighting off marketings [bigger is better](http://www.milwaukeepolicenews.com/) and we are setting up automated torture machines for our code. All for the milliseconds, all to keep our visitors attention.

Needless to say, reshaping, contorting, torturing your code in order to conform to the 14 rules also leaves you with something that is utterly unapproachable from a developers standpoint. Well optimized production grade static assets are as far from good development practices as you can possibly come. One module per file? Forget it, to expensive. Each image as a seperate file? You must be crazy, go decode this Base64 or pull out an image editor to reconstruct it from a sprite. And that JavaScript error you're trying to debug? Start unwrapping uglified concatenated code in your head, under time pressure of course, production is down you know...

Unmaintainable. Complex. Prone to errors.

We are being held hostage by the protocols that serve us. I hope you haven't developed Stockholm syndrome by now.


## All hail SPDY/HTTP2

Our savior is here. SPDY promises deliverance from all the hardships we have endured. In the future we will all have [gzipped HTTP headers](http://www.chromium.org/spdy/spdy-protocol/spdy-protocol-draft3#TOC-2.6.10.1-Compression), [multiplexed HTTP streams](http://www.chromium.org/spdy/spdy-protocol/spdy-protocol-draft3#TOC-4.3-One-Connection-Per-Domain) mitigating a lot of hand shaking and [slow-start](http://en.wikipedia.org/wiki/Slow-start). All of this with keep-alive that works properly. Oh the rejoicing. And all that for just the cost of [adding SSL](http://en.wikipedia.org/wiki/SPDY#Design).

Wait, what?

Oh yes, no SSL, no SPDY. So we're getting a lot of nice enhancements, but are also forced to accept the added overhead of a [TLS handshake](http://en.wikipedia.org/wiki/Transport_Layer_Security#TLS_handshake), a slow ordeal ([tweakable though](http://unhandledexpression.com/2013/01/25/5-easy-tips-to-accelerate-ssl/)).

So suddenly it comes down to a tradeoff. HTTP overhead versus TLS handshake overhead. Which one to chose depends on the nature of your site, yet another factor, and that may change over time. So no simple answers here. Jimmy Durante seems to sum up [this situation](https://www.youtube.com/watch?v=bY-zmJ1VCQI) pretty well.

And even in this new world of SPDY, our old rules of minification still apply. Concatenation still yields fewer requests. And while the overhead of each request is lower with SPDY, since we're multiplexing into the existing stream, [latency](http://en.wikipedia.org/wiki/Latency_(engineering)#Packet-switched_networks) isn't a thing that magically vanishes.

There may be a way to change the game though.


## PUSHing the limits

SPDY offers us an interesting new tool though. PUSH streams. Your SPDY endabled server is suddenly able to initiate new multiplexed streams during existing requests, thus sending you stuff you didn't even ask for... yet. While this may sound a bit ominous, the gist of it is that if the server knows what assets you are about to ask for it is able to initiate a PUSH stream of those assets directly to your browser before the browser even knew it needed them.

That latency I told you about before, caused by GET request roundtrips? Magically vanished!

So SPDY PUSH is great news. Really great actually. If we can eliminate the overhead there is by initiating a GET request for an asset, the number of assets suddenly isn't an issue. If the number of assets doesnt matter, why even bother bundling?

Remember those build pipelines I talked about before? Unmaintainable? Complex? Prone to errors? Gone!

That's right. We don't need them any more. With all the latency overhead in transferring multiple assets gone, we can rethink our production code. You still want to minify code, but you can keep files seperate.

Our HTTP optimized build systems bundled code in few files. This also means that a single change to just a single module will trigger a re-download of the entire bundle. So the previous best strategy was to bundle and serve all static assets with a far future expires header, hoping for a cache hit on the next visit, and thus not even triggering a GET request for the assets at all. A good strategy under the circumstances.

But imagine serving every asset individually. Suddenly a change to single file only means you actually need to push that single file to the browser cache. ALl the rest of the assets, the ones you haven't touched? Still cached. No re-download.

So you might rightfully ask, how can the server know if the browser has an assets cached already if the browser doesn't initiate a request for the asset, and thus doesn't send any request headers for that particular file? Good question. It can't know. So instead the server just opens the flood gates and simply just starts a PUSH stream for every asset you need, and starts pumping. For the server, and the performance hungry engineer, it's all about saturating the bandwidth as much as possible and gettign that data over the wire.

Each PUSH request start with a header though. Properly configured, say with an [ETag](http://en.wikipedia.org/wiki/HTTP_ETag) with a latest time stamp or MD5 sum of the file content, the browser knows within the first few packets if it needs the rest of the transmission or not. The browser can simply hang up that particular stream. So the server will be pushing some data that is useless. It's an optimistic and greedy apprach. But it does leverage the cache properly, and the extra spent bytes on the wire aren't noticed, as a terminated connection is hung up in the same time a normal HTTP GET roundtrip would take to even request some initial data from a server.

So this is the theory. HTTP GET roundtrip latency removed, improved bandwidth saturation, better cache reuse. Assuming the server knows what to send.

So how do we teach our servers about that?


## The context aware static file server

The bad news is, there is no specified configuration format for telling your server what to push when a specific file is requested. The [Nginx team](https://twitter.com/nginxorg) at least [came up empty handed](https://twitter.com/nginxorg/status/436182316042301440) when asked about it. So for now we are on our own here. That might actually be ok so far. Many of us are running some sort of server that we have fine rained control over. Frameworks like [express](http://expressjs.com/) certainly makes this easier.

So lets look at some strategies for making your static web server context aware. There are a few strategies I can think of that can be used to seed a web server with context enough to start leveraging SPDY PUSH.

### Referral header mapping

Imagine that your server uses the [refer<strike>r</strike>er](http://en.wikipedia.org/wiki/HTTP_referer) to record the relations between files over time. HTML → CSS → Image and so forth. Gradually the server can build up a relation map and thus infer from a GET request to an HTML-file, what other assets are likely to be requested next. The downside here is that this functionality may take some time to warm up, and while it does, your visitors will be paying the price of multiple request latencies.

### HAR file mapping

You might be able to build a functionality into your server that knows how to interpret [HAR files](http://www.speedawarenessmonth.com/what-is-a-har-file-and-what-do-i-use-it-for/). These files are basically what you are looking at when using your favorite browser developer tools network tab. So you might be able to set up some preproduction step that automates a headless webkit to scrape all your pages and export a series of HAR-files, which the server can use to reconstruct a dependency graph between your files.

### Static analysis

This one is my favorite, and where I get to pitch one of my personal projects. [Assetgraph](https://github.com/assetgraph/assetgraph) can be used to staticly analyze your web assets and create a graph model that contains all files and relations between them. Think of it as a browser that scrapes your entire site, except it only ever visits every ressource once and can run directly on your file system. Having your static file server traverse the entire dependency graph on startup would seed it with all the contextual knowledge it needs for SDY PUSH.


## Science or Fiction?

So I wanted to take a look at what is possible with the technology we have now, and see if we can get to the point where performance measurements and comparisons with existing solutions are actually possible. Needless to say SPDY or HTTP2 aren't main strem yet, but it's nice to look head at what is inevitably to come.

I started out with the idea of using Assetgraph for all the graph knowledge. I am a maintainer of the project an have been for a few years. This is my go to tool for anything web. So from there I needed a server that could hook into this graph instance. I know a bit of nodejs, so I found a wonderful module by [Fedor Indutny](https://github.com/indutny), called [node-spdy](https://github.com/indutny/node-spdy). As luck would have it, node-spdy is compatible with express, which I have touched a few times before.

So after a few hours of hacking I came up with [expush](https://github.com/Munter/expush). A small proof of concept static file server that will search for html-files in the web root and autodiscover any outgoing dependencies recursively, creating a dependency graph which the file server will look at before it falls back to serving files from the file system. Whenever an HTML-page is requested, the entire dependency tree from it will be traversed and a PUSH request is initiated for each of them.

These are early days. It's quite buggy and has no finish at all, but it's enough to prove that this can be done. There are all sorts of bugs, like errors being thrown when reloading a page before the keep-alive dies, Chrome not actually supporting ETag cache header response peoperly, so every asset is pushed over the wire in its entirety etc. I do think that this experiment should be enough to do some initial speed tests and comparisons with various other web performance optimization setups.

So, answering the heading of this section, science, not fiction. However I am not a benchmark expert. So if you are one, or know one, please poke me and lets see if we can get some science going.

Is PUSH the post GET paradigm? I hope so.

--
Peter Müller, https://github.com/Munter
