---
layout: post
title:  "PUSH, the post GET paradigm"
date:   2014-02-27 19:15:29
categories: web development performance assetgraph spdy http2
---

# PUSH, the post-GET paradigm

Web performance these days is non-optional. If your web page is slow, you lose business. Our visitors are an impatient lot, and though they are not actively counting milliseconds, web developers have to, just in order to keep visitors' thoughts away from cat videos and flappy bird.

In our hunt for milliseconds we, the web developers, are going through a great ordeal just to keep up. We are following [the 14 rules](http://stevesouders.com/hpws/rules.php), we are fighting off marketing's [bigger is better](http://www.milwaukeepolicenews.com/) and we are setting up automated torture machines for our code. All for the milliseconds, all to keep our visitors' attention.

Needless to say, reshaping, contorting, torturing your code in order to conform to the 14 rules, also leaves you with something that is utterly unapproachable from a developer's standpoint. Well optimized production grade static assets are almost as far away from good development practices as you can possibly get. One module per file? Forget it, too expensive. Each image as a separate file? You must be crazy, go decode this base64 or pull out an image editor to reconstruct it from a sprite. And that JavaScript error you're trying to debug? Start unwrapping uglified concatenated code in your head, under time pressure of course; production is down you know...

Unmaintainable. Complex. Prone to errors.

We are being held hostage by the protocols that serve us. I hope you haven't developed Stockholm syndrome by now.


## All hail SPDY/HTTP2

Our savior is here. SPDY promises deliverance from all the hardships we have endured. In the future we will all have [gzipped HTTP headers](http://www.chromium.org/spdy/spdy-protocol/spdy-protocol-draft3#TOC-2.6.10.1-Compression), [multiplexed HTTP streams](http://www.chromium.org/spdy/spdy-protocol/spdy-protocol-draft3#TOC-4.3-One-Connection-Per-Domain) mitigating a lot of hand shaking and [slow-start](http://en.wikipedia.org/wiki/Slow-start)s. All of this with keep-alive that works properly. Oh the rejoicing. And all that for just the cost of [adding SSL](http://en.wikipedia.org/wiki/SPDY#Design).

Wait, what?

Oh yes, no SSL, no SPDY. So we're getting a lot of nice enhancements, but are also forced to accept the added overhead of a [TLS handshake](http://en.wikipedia.org/wiki/Transport_Layer_Security#TLS_handshake), a slow ordeal ([tweakable though](http://unhandledexpression.com/2013/01/25/5-easy-tips-to-accelerate-ssl/)).

So suddenly it comes down to a tradeoff. HTTP handshake overhead versus TLS handshake overhead. Which one to choose depends on the nature of your site, and that may change over time. So no simple answers here. Jimmy Durante seems to sum up [this situation](https://www.youtube.com/watch?v=bY-zmJ1VCQI) pretty well.

And even in this new world of SPDY, our old rules of minification still apply. Concatenation still yields fewer requests. And while the overhead of each request is lower with SPDY, since we're multiplexing into the existing stream, [latency](http://en.wikipedia.org/wiki/Latency_(engineering)#Packet-switched_networks) isn't a thing that magically vanishes.

There may be a way to change the game though.

**NOTE**: HTTP/2 [does not](http://http2.github.io/http2-spec/#discover-http) require SSL.

## PUSHing the limits

SPDY offers us an interesting new tool, PUSH streams. Your SPDY enabled server is suddenly able to initiate new multiplexed streams during existing requests, sending stuff the client hasn't even asked for... yet. While this may sound a bit ominous, the gist of it is that if the server knows what assets the client is about to ask for, it is able to initiate a PUSH stream of those assets, storing them directly in the browser cache before the browser even knew it needed them.

That latency I told you about before, caused by GET request round trips? Magically vanished!

So SPDY PUSH is great news. Really great actually. If we can eliminate the overhead of initiating a GET request for an asset, the number of assets suddenly isn't an issue. If the number of assets isn't an issue, why even bother bundling?

Remember those build pipelines I talked about before? Unmaintainable? Complex? Prone to errors? Gone!

That's right. We don't need them any more. With all the latency overhead in transferring multiple assets gone, we can rethink our production code. You still want to minify code, but you can keep files separate.

Our HTTP optimized build systems bundled code in as few files as possible. The previous best strategy was to bundle and serve all static assets with a far future expires header, hoping for a cache hit on the next visit, and thus not even triggering a GET request for the assets at all. A good strategy under the circumstances. However, a single change in just a single module will change the entire bundle, thus triggering a re-download and transferring more bytes overall, with more GET round trips needed.

But imagine serving every asset individually. Suddenly a change to single file means you only need to push that specific file to the browser cache. All the rest of the assets, the ones you haven't touched? Still cached. No re-download.

So you might rightfully ask, how can the server know if the browser has an asset cached already if the browser doesn't initiate a request for the asset, not sending any request headers for that particular file? Good question. It can't know. Instead the server just opens the flood gates by starting a PUSH stream for every asset you might need, and starts pumping. For the server and the performance hungry engineer, it's all about saturating the bandwidth as much as possible and getting that data over the wire.

Each PUSH request starts with a header, though. Properly configured, say with an [ETag](http://en.wikipedia.org/wiki/HTTP_ETag) with a last modified timestamp or hash of the file content, the browser knows within the first few packets if it needs the rest of the transmission or not. The browser can simply hang up that particular stream. So the server might push a few packets in vain and stop when the browser tells it to. It's an optimistic and greedy approach. But it does leverage the cache properly, and the extra spent bytes don't cost a huge time overhead, since the stream termination request goes over the wire in the same time a normal HTTP GET round trip would take just to request some initial data from a server. It's a tradeoff, lower latency for higher data transfer.

So this is the theory. HTTP GET round trip latency removed, improved bandwidth saturation, better cache reuse. Assuming the server knows what to send.

So how do we teach our servers about that?


## The context aware static file server

The bad news: there is no specified configuration format for telling your server what to push when a specific file is requested. The [Nginx team](https://twitter.com/nginxorg) at least [came up empty handed](https://twitter.com/nginxorg/status/436182316042301440) when asked about it. So for now we are on our own for now. However many of us are running some sort of server that we have fine grained control over. Frameworks like [express](http://expressjs.com/) certainly make modifications like these easier.

So let's look at some strategies for making your static web server context aware. There are a few I can think of that could be used to seed a web server with enough contextual knowledge to start leveraging SPDY PUSH.

### Referrer header mapping

Imagine that your server uses the [refer<strike>r</strike>er](http://en.wikipedia.org/wiki/HTTP_referer) to record the relations between files over time. HTML → CSS → Image and so forth. Gradually the server can build up a relation graph and thus predict a set of other assets likely to be requested next when seeing a GET request for an HTML file. The downside here is that this functionality may take some time to warm up, and while it does, your visitors will be paying the price of multiple request latencies.

### HAR file mapping

You might be able to build a server that knows how to interpret [HAR files](http://www.speedawarenessmonth.com/what-is-a-har-file-and-what-do-i-use-it-for/). These files are basically what you are looking at when using your favorite browser developer tools network tab. So you might be able to set up some preproduction step that automates a headless webkit to scrape all your pages and export a series of HAR files, which the server can use to reconstruct a dependency graph of your files.

### Static analysis

This one is my favorite, and where I get to pitch one of my personal projects. [Assetgraph](https://github.com/assetgraph/assetgraph) can be used to statically analyze your web assets and create a graph model that contains all files and relations between them. Think of it as a browser that scrapes your entire site, except it only ever visits every resource once and can run directly on your file system. Having your static file server traverse the entire dependency graph on startup would seed it with all the contextual knowledge it needs for SPDY PUSH.


## Science or Fiction?

So I wanted to take a look at what is possible with the technology we have now, and see if we can get to the point where performance measurements and comparisons with existing solutions are actually possible. Needless to say, SPDY or HTTP2 aren't mainstream yet, but it's nice to be prepared.

I started out with the idea of using Assetgraph for all the graph knowledge. I have been a maintainer of the project for a few years, so this is my go to tool for anything web. From there I needed a server that could hook into this graph instance. I know a bit of node.js, so I found a wonderful module by [Fedor Indutny](https://github.com/indutny) called [node-spdy](https://github.com/indutny/node-spdy). As luck would have it, node-spdy is compatible with express, which I have touched a few times before.

So after a few hours of hacking I came up with [expush](https://github.com/Munter/expush). A small proof of concept static file server that will search for html-files in the web root and auto discover any outgoing dependencies recursively, creating a dependency graph which the file server will look at before it falls back to serving files from the file system. Whenever an HTML-page is requested, the entire dependency sub graph from it is traversed and a PUSH request is initiated for each asset.

These are early days. It's quite buggy and has no finish at all, but it's enough to prove that this can be done. There are all sorts of bugs, like errors being thrown when reloading a page before the keep-alive dies and [Chrome not actually supporting ETag cache header response properly](https://groups.google.com/d/msg/spdy-dev/TetVOinB-LM/rODtXlx1KUQJ), so every asset is pushed over the wire in its entirety. I do think that this experiment should be enough to do some initial speed tests and comparisons with various other web performance optimization setups.

> Måske værd at nævne at Assetgraph også kan minimize/bundle/..., hvilket må gøre komparative tests nemmere...

So, answering the heading of this section, we are talking about science, not fiction. However I am not a benchmark expert. So if you are one, or know one, please poke me and lets see if we can get some numbers and science this thing up!

Is PUSH the post-GET paradigm? I hope so.

--
Peter Müller, https://github.com/Munter
