---
layout: post
title:  "Getting started with Assetgraph"
date:   2014-07-02 00:15:00
categories: frontend build assetgraph tooling
twittertext: "Get started with Assetgraph, the web tool makers toolbox that works with your web page like browsers do"
disquss: true
---

When presented with the challenges of web performance optimization, or any other kind of manipulation of web sites and assets, it is helpful to have a good set of tools at your disposal. Assetgraph aims to be exactly this. A high level interface for your websites, yet still providing low level interfaces for individual assets. A toolkit that lets you build your own tools that fit very specificly to your individual needs.

I have spoken at lengths about how Assetgraph distinguishes itself from other build tools by not just being another unix tool configuration wrapper. In the following I will assume you have already heard me sing Assetgraphs praises. If you haven't, [watch my talk from EmpireJS](https://www.youtube.com/watch?v=N_gRlmmF4Rc).

Assetgraph is a node module and this post assumes that you are relatively comfortable writing and executing node scripts. By the end you should have learned enough about Assetgraph to get your hands dirty and write your own tools with it.

If you want to see how easy it is to build tools that [filter out unused files](/2014/getting-started-with-assetgraph/#toc_10), [inlines your images](/2014/getting-started-with-assetgraph/#toc_11) or [rename files for optimal caching](/2014/getting-started-with-assetgraph/#toc_12), you are in for a treat!

If you are more into just consuming a well tested out-of-the-box build tool, take a look at [assetgraph-builder](https://github.com/assetgraph/assetgraph-builder) or its grunt-wrapper [grunt-reduce](https://github.com/Munter/grunt-reduce).


Assetgraph Vocabulary
---------------------

Before we get started it's useful to get some vocabulary straight. If you're not easily confused you might want to skip to the part where you [get your hands dirty](#toc_7).

Like many bigger projects Assetgraph has some project specific vocabulary. We've tried not to be too magical about the terms we chose, so hopefully you'll get what things are from their name. Sometimes the inherent properties that go with the names are non-obvious though. This is an attempt at an explanation.


### Asset

An Asset in Assetgraph is a model of the contents of a file including its metadata. Assets have a bunch of base properties that are relevant to all asset types, like content-type, url, file name, file extension, loaded state, inlined or not. All Assets have a `rawSrc` getter and setter, giving you direct access to the raw file behind the asset. They also have a bunch of convenience methods like `md5Hex`, `clone` and `replaceWith`, along with a `populate` method to parse and find outgoing relations in the source code of the asset.

The most interesting things happen in the Asset constructors for more specific data types, like [`Html`](https://github.com/assetgraph/assetgraph/blob/master/lib/assets/Html.js) or [`JavaScript`](https://github.com/assetgraph/assetgraph/blob/master/lib/assets/JavaScript.js), where each Asset instance also has a highlevel instance of the Assets types data model. For HTML this is the DOM, modelled with [jsdom](https://www.npmjs.com/package/jsdom). For JavaScript it's the [uglify-js](https://www.npmjs.com/package/uglify-js) AST.

Using these highlevel interfaces you have the ability to manipulate each assets as you see fit, using familiar highlevel abstractions you would also find in the browser.

You might want to take a look at the [full list of already implemented Asset types](https://github.com/assetgraph/assetgraph/tree/master/lib/assets).

### Relation

A Relation in Assetgraph defines the edges of the graph. They bind the Assets together and define what depends on what, and from where. Relations not only keep track of which file needs what other file. They also keep track of where exactly the relation came from. Be it a Html Script node src attribute or a CSS background image url token. Relations automatically update references when Assets move around, making the dependency graph stable at all times without broken links.

Relations have `type`, `to`, `from` and `href` properties that are highly relevant when querying the graph for them.

There are a bunch of convenience functions available for more lowlevel graph manipulation, which I'll skip for now as this is just an introduction.

Here is [the full list of Assetgraph Relations](https://github.com/assetgraph/assetgraph/tree/master/lib/relations).

### Query

The Assetgraph Query model is a [MongoDB inspired](http://docs.mongodb.org/manual/tutorial/query-documents/) model where you can combine some simple boolean AND, OR, NOT statements into a powerful expression to specificly target only the Assets or Relations you are interested in.

Each query is a function that matches the properties of each Asset or Relation with the corresponding property or the object in the query. The query object can use strings, numbers, arrays, regexes, user defined functions and even recursive query objects to match the subject.

Some examples:

``` javascript
var query = require('assetgraph').query;

var simple = query({
    type: 'Html',
    isLoaded: true
});

var boolean = query.or({
    url: /^http:/
}, {
    fileName: function (fileName) {
        return fileName.length > 8;
    }
});

var nested = query({
    type: 'HtmlAnchor',
    from: {
        isInline: false
    },
    to: {
        isImage: true
    }
});

```

Most interactions with Assetgraph happen trough queries to the graph. It is recommended that you get to know the query model if you want to be an effective tool maker. Often times you'll see simple query objects being passed into Assetgraph methods or Transforms without the `query()` call. Assetgraph will automatically turn such objects into queries for your convenience.

Take a look at the [Assetgraph Query source code](https://github.com/assetgraph/assetgraph/blob/master/lib/query.js).

### Assetgraph
The Assetgraph is the instance that ties all of the above together. This is where the Assets and Relations are stored and where you can use a Query to find them all again. There are a bunch of convenience methods for pre-order and post-order traversal and of course the most used ones [`findAssets`](https://github.com/assetgraph/assetgraph#querying-the-graph) and [`findRelations`](https://github.com/assetgraph/assetgraph#querying-the-graph).

### Transform
Assetgraph is cool, but always diving into the lowlevel code of specific Asset syntax trees becomes bothersome pretty quickly. Transforms are highlevel functions that wrap these lowlevel calls, manipulating the Assetgraph instance in more convenient ways. Assetgraph is extensible, so you can write your own highlevel transforms that fit your specific needs. Assetgraph already comes preloaded with a lot of very useful transforms, most of which are written with web performance optimization in mind, but don't let yourself be limited by that!

There are some fine descriptions of most of the available core transforms in the [Assetgraph README](https://github.com/assetgraph/assetgraph/blob/master/README.md).

### Transform Queue
The Transform Queue is what lets you chain a number of transforms together to form a pipeline that applies multiple transforms in order. While all installed transforms are available directly on the Transform Queue __and__ Assetgraph instance for you convenience, they all return a reference to the Transform Queue they are in, enabling you to easily chain Transforms. There are a few convenience methods on the Transform Queue, like `if`, `endif` and `queue` (for quick inline transforms), the most important one is `run`.

If you don't `.run()` the Transform Queue, nothing will happen.


Minimum Assetgraph Lifecycle
----------------------------

While tools have great diversity, there will always be some common boilerplate that needs to be written in order to bootstrap them. The same goes for Assetgraph-based ones. This will be an explanation of how a bare minimum setup will look with Assetgraph.

First, it's important to remember that Assetgraph can only work with websites if their internal references are valid. This may sound like an obvious best practice, since that is the only way a website can actually be loaded in a browser. Sadly I need to point this out, as most existing web performance build chains actually set you up with non-working websites, that are then assembled by the tool or some configuration of a static file server. If you want to get the most out of Assetgraph, build your websites so they work in the browser with no magic in between. Incidentally this simplifies your workflow greatly and lessens the pain for front-end developers considerably, so I consider it best pratice.

Now, let's get started. Consider a website structure like this one:


```
app/
├── css
│   └── main.css
├── js
│   ├── main.js
│   └── jquery.js
├── images
│   └── logo.png
├── index.html
└── favicon.ico
```

Your web application is in a directory called `app` and you have som pretty basic scaffolding done already. A simple start for a simple introduction. Note that this is just an example. Assetgraph makes no assumptions about directory structure as it will infer it from your source code.

We start out with creating a script that can load the website into an Assetgraph instance:

``` javascript
var Assetgraph = require('assetgraph');

var graph = new AssetGraph({
    root: 'app'
});
```
The above creates an Assetgraph instance, configuring it with `app` as the web root. The root must be a string, and may be any valid `file://`, `http://`, `https://` or `ftp://` url. If no protocol is specified, a location on local disc is assumed, and the path is resolved as you would expect on the command line.

An Assetgraph instance in itself, without any data, is quite useless. So next up we're interested in actually loading data from our website into the graph. We can do this using the [`loadAssets`](https://github.com/assetgraph/assetgraph#assetgraphloadassetsfilenamewildcardurlasset-) transform. Loading your `index.html` into the graph can be done like so:

``` javascript
graph.loadAssets('index.html');
```
The `loadAssets` transform takes a range of inputs to make your life easier. The most useful to you now will be the string or array of strings. Each string, just like before, may be a full url or a protocol relative url in the previously described schemes. All relations in the graph will use the Assetgraph root to resolve paths, not the file system root. If you want to get more advanced with the `loadAssets` transform it might be useful to consult the [source code](https://github.com/assetgraph/assetgraph/blob/master/lib/transforms/loadAssets.js) for now.

Before we can run the script there is one more piece of boilerplate code that needs to be added. What we are doing when calling Assetgraph transforms with configuration parameters, is actually not executing them right away. Instead, we are appending them to a transform queue, which is what is returned from the transform call. To make this explicit in this example we save the return value in a new variable:

``` javascript
var queue = graph.loadAssets('index.html');
```

All transforms in the queue are run in the queue scope and will return the queue, making transforms chainable. All transforms will have the assetgraph instance passed to them as the first parameter. The `loadAssets` call you just added to your script, won't actually be run before the transform queue has been started. We do this using the `run` method:

``` javascript
queue.run();
```

This implementation detail is a bit counter intuitive and can bite you later, so make a note of it now and I will make a note on improving the API. If it hasn't changed by September 2014 you are hereby mandated to bug me about it on Github.

You can now run your script, and `index.html` will be loaded into the graph model. However this is not terribly exciting yet, since all that happens is reading a file into memory and not logging any output. So let's make it a bit more exciting by adding some logging to the console.


Logging and Debugging
---------------------

Setting up logging is done on the Assetgraph instance, meaning it goes before the transform queue is run. Your script now looks like this:

``` javascript
var Assetgraph = require('assetgraph');

var graph = new AssetGraph({
    root: 'app'
});

graph.on('addAsset', function (asset) {
    console.log('addAsset', asset.toString());
});

var queue = graph.loadAssets('index.html');
queue.run();
```

We're hooking into the Assetgraph emitted event `addAsset` and logging some basic information about the event and the asset that was added to the graph. Try running your script now, and you should actually see some output in your console. There are more events you can hook into, to get some more insight into the internals of Assetgraph: `addAsset`, `removeAsset`, `addRelation`, `removeRelation`, `beforeTransform`, `afterTransform`.

Furthermore there are some different error levels that are especially useful to hook into in order to get some more useful information for debugging your code: `info`, `warn`, `error`. These last ones are conditions of increasing severity.

`info` is usually used when Assetgraph sees a potential error situation in your web application code, but a fix has already been applied. This could be trying to bundle scripts where one or more of them are leaking strict mode to the global scope, or exceeding the IE max style sheet rules number. Don't worry too much about `info` events.

If you see `warn` events you should take note, as these usually describe problems in your web application that have to be fixed by you. Things like parse errors or missing files that would cause a 404 response in production etc.

The `error` event is the most severe. This is usually only emitted when a completely non-recoverable error has been encountered, or a library throws unexpectedly. It usually makes sense to just stop running your script if you hit this one. It's also likely that when you get `error` level events that we'd like to hear about it, as it might indicate a missing error handling in Assetgraph. Please [report these to us](https://github.com/assetgraph/assetgraph/issues/).

Let's spice it up with one more logging detail, writing some stats about the assets contained in the graph to `stderror`:

```
queue.writeStatsToStderror();
```


Populating the Dependency Graph
-------------------------------

We've now arrived at the core functionality of Assetgraph. The arguably most powerful functionality is the ability to automatically and recursively traverse the dependencies of loaded assets. This, as they say, is where the magic happens, and what enables you to work with your web assets in their entire context without having to define large manifest files telling your tool what files you want included.

We are using the [`populate`](https://github.com/assetgraph/assetgraph#transformspopulateoptions) transform. The transform can be configured in a multitude of ways, in order to describe how to traverse the dependency graph, what to load, and more importantly, what not to load. Think of this as a web scraper. Let it scrape everything and you might end up copying the internet, so **use with care**.

Available options are:

```
{
    followRelations: <Assetgraph.query>,
    startAssets: <Assetgraph.query>,
    from: <Assetgraph.query>, // Alias for 'startAssets'
    stopAssets: <Assetgraph.query>,
    concurrency: <int> // Number of concurrent requests. >= 1
}
```

It should be obvious by now that it is useful to get to know the query syntax.

For now I'll assume that we are working with a web site on local disc and that we are only interested in loading assets into Assetgraph that are local as well. So we want to configure the `populate` transform to only follow urls that are relative or root relative, while excluding the ones that are absolute or protocol relative (ie. on a different domain).

We can do this like so:

``` javascript
queue.populate({
    followRelations: {
        hrefType: ['relative', 'rootRelative']
    }
})
```

This makes your final bootstrap script look like this:

``` javascript
var AssetGraph = require('assetgraph');

var graph = new AssetGraph({
    root: 'build'
});

graph.on('addAsset', function (asset) {
        console.log('addAsset', asset.toString());
    });

var queue = graph.loadAssets('index.html');

queue.populate({
    followRelations: {
        hrefType: ['relative', 'rootRelative']
    }
});

// Put further transforms here

queue.writeStatsToStderr();

queue.run();

```

Congratulations, You have now successfully loaded the entirety of your local files, **which you are referring to in your source code**, into Assetgraph. You are now bootstrapped with all you need in order to work with your assets.

Normally a starter guide would end here, but I'll throw in some quick examples that might be of use to you, just so you get some ideas of what is possible.


Writing files to disc
---------------------

Reading files from disc to memory is fun, but it's even more fun writing them back to disc. Assetgraph lets you rework your dependencies and assets in memory in the transform queue, but the only way you gain anything from that is by actually saving the changes.

To write your files back to disc we'll use the [`writeAssetsToDisc`](https://github.com/assetgraph/assetgraph#assetgraphwriteassetstodiscqueryobj-outroot-root) transform. The first argument is a query object, which we'll make pretty broad, only limiting it to assets that have been loaded (trying to write unloaded assets to disc won't work anyway).

The second argument is the root directory to write the files to. You can leave it blank, which will fall back to the Assetgraph instance root, meaning you are overwriting the files in their existing location. Might be useful, but normally you want to separate your source files from your output files. We're setting a new outRoot `demo`.

``` javascript
queue.writeAssetsToDisc({
    isLoaded: true
}, 'demo');
```

Congratulations, you have now copied all your referenced assets from one directory to another. While you think this might as well have been accomplished with `cp -r app demo`, the important point to note is **your referenced assets**. If you haven't somehow included a file on your website, it won't be in `demo`. Imagine how many unreferenced files get put into production every day by people forgetting about them. Even worse, imagine a bower component has a malicious php file with a rights escalation somewhere in a test directory, and you just copied it to your production server.

So see this as a useful step to only get the essentials on your production site. If something is missing now it's because you didn't refer to it. This could easily happen with error pages, favicon.ico, robots.txt or similar. If you want unreferenced files to explicitly be a part of the graph, make sure to include them in the `loadAssets` transform.


Inlining small images
---------------------

Base64 encoding and inlining images. A tedious and stupid workflow. In development you want to work with your raw images to make it easier to maintain and debug, while in production you want to reduce http requests by bundling or inlining. Automation is the way and Assetgraph can help.

We'll limit ourselves to only images that are CSS backgrounds, as inlining content images requires some more specific knowledge of the context. I choose a completely arbitrary number for the file size of images to inline: 4096 bytes. Feel free to experiment on both accounts.

We're using the [`inlineRelations`](https://github.com/assetgraph/assetgraph#assetgraphinlinerelationsqueryobj) transform, which is dead simple. The only thing that is happening here is just a more complex query than I've shown before.

``` javascript
queue.inlineRelations({
    type: 'CssImage',
    to: {
        isLoaded: true,
        isInline: false,
        rawSrc: function (rawSrc) {
            return rawSrc.length < 4096;
        }
    }
});
```


File revving
------------

File revving is a fancy word for revisioning files for optimal caching in the visitor's browser. The optimal way to serve static assets is with a far future cache expiry, since the fastest request is no request at all.

The optimal revisioning strategy is including a hash of the file content in the file name. If the file hasn't changed, the hash isn't changed, giving you the ability to optimally use the cache of the visitor's browser for unchanged files and only load the ones that have changed since the last visit.

The easiest way to set up cache headers for static assets is to put them all in the same directory, where the web server will append the correct cache header to the HTTP response.

If none of this made sense, then I highly encourage you to read up on optimal asset delivery for browsers. Your users will thank you.

This is by far the most complex example, but I want to show it because this is a place where Assetgraph shines compared to other build tools that do not have a dependency graph model at their core.

Our strategy for renaming the files in the right order will be [post order traversal](http://en.wikipedia.org/wiki/Tree_traversal#Post-order), renaming leaf nodes in the graph before branch nodes to assure that the hash we calculate is actually based on the correct file contents including hashed references to decendants.

First we need to craft a query that will only rename the files we want renamed. Some files might be static, but we still want them to keep their original url and take part in a different caching scheme, designed for rapid updates. Think of HTML pages, RSS feeds etc. I have come up with this query combination to target only the files that are safe to rename:

``` javascript
var query = AssetGraph.query;
var moveQuery = query.and(
    // Find all loaded an non-inlined assets
    // Except ones of the defined types and fileNames
    {
        isLoaded: true,
        isInline: false,
        type: query.not([
            'CacheManifest',
            'Rss'
        ]),
        fileName: query.not([
            '.htaccess',
            'humans.txt',
            'robots.txt',
            'favicon.ico'
        ])
    },

    // Exclude HTML-files that are linked to
    query.not({
        type: 'Html',
        incomingRelations: function (relations) {
            return relations.some(function (rel) {
                return rel.type === 'HtmlAnchor';
            });
        }
    }),

    query.or(
        // Exclude initial assets from renaming
        query.not({
            isInitial: true
        }),
        // Include external HTML templates
        {
            type: 'Html',
            isFragment: true
        }
    )
);

```

The above is a distillation of a few years of iteration to try and define best practice for the most common use cases. I'd love to go into depth on this, but that's certainly not fit for a beginners guide. Copy paste this for now and return when you are more comfortable with your understanding of the graph model and the query model.

Now all that is left is to run the [`moveAssetsInOrder`](https://github.com/assetgraph/assetgraph#assetgraphmoveassetsinorderqueryobj-newurlfunctionorstring) transform, which does our post order traversal for us. It takes a query as the first argument and a function as the second. The function is called once per asset and the expected return value is the new file name of the asset.

We're moving all revved files into `/static` and appending the first 10 chars of the hash of the file to the file name.

``` javascript
queue.moveAssetsInOrder(moveQuery, function (asset) {
    var targetUrl = '/static/';

    return targetUrl + asset.fileName.split('.').shift() + '.' + asset.md5Hex.substr(0, 10) + asset.extension;
});
```

Seems pretty easy right? Just like copying. Except, not. This is where the graph model comes in handy. When moving files by giving them a new url, all their incoming relations automatically get updated. So all the places where the old file name was referenced before are now correctly pointing at the new location. If you've ever tried to do this with unix tools, out of context of the website as a whole, you will know what a difficult feature this is. But here you have it, implemented in very few lines of code.

Now all that is left to do is configure your web server to serve all files from `/static` with far future expires cache headers. Look up how to in your relevant server manual or on StackOverflow.


Summing up
----------

You've hopefully learned a bit more about Assetgraph now and are ready to get your hands dirty and try out new stuff on your own. At the very least I hope you've gained an understanding of the strengths and weaknesses of the paradigm and the toolset, so I am looking forward to getting grilled with relevant questions here, on [Twitter](https://twitter.com/_munter_) or [Github](https://github.com/assetgraph/assetgraph/issues/) or on a [conference we both attend](http://lanyrd.com/profile/_munter_/future/) over a beer ;)

I'm always asked for comparisons with other popular tools, like Grunt, Gulp, Broccoli or similar. Assetgraph is not one to one comparable, as is primarily focuses on fully functional references, while the other tools primarily deal with files. This enables the other tools to do whatever, while Assetgraph needs your page to actually work before you can unlock the full potential. This makes Assetgraph wel suited as a post processing tool that you apply to the already assembled page. If you use one of the other tools to achieve this assembly is up to you.

I'm also often asked about run time speed. Assetgraph is generally faster than Grunt, due to the limited file I/O. Assetgraph is generally slower than Gulp, since Gulp has you predefine your files and can run pipes in parallel while Assetgraph has to discover the files incrementally and runs transforms sequentially.

If you wish to use Assetgraph for web performance optimization it is my recommendation to make it a part of your deployment step, not your development loop. Web performance optimization is about transforming code to be machine optimized, while your development loop is about optimizing for humans. When you move these concerns out of the development loop you will see that your development speeds up, and the time it takes to run a build suddenly is of much lesser importance.

This is the final compilation of all examples, now prettified a bit:

``` javascript
var AssetGraph = require('assetgraph');
var query = AssetGraph.query;
var moveQuery = query.and(
        {
            isLoaded: true,
            isInline: false,
            type: query.not([
                'CacheManifest',
                'Rss'
            ]),
            fileName: query.not([
                '.htaccess',
                'humans.txt',
                'robots.txt',
                'favicon.ico'
            ])
        },
        query.not({
            type: 'Html',
            incomingRelations: function (relations) {
                return relations.some(function (rel) {
                    return rel.type === 'HtmlAnchor';
                });
            }
        }),
        query.or(
            query.not({
                isInitial: true
            }),
            {
                type: 'Html',
                isFragment: true
            }
        )
    );

var graph = new AssetGraph({
        root: 'build'
    });

graph.on('addAsset', function (asset) {
        console.log('addAsset', asset.toString());
    })
    .loadAssets('index.html');
    .populate({
        followRelations: {
            hrefType: ['relative', 'rootRelative']
        }
    })
    .inlineRelations({
        type: 'CssImage',
        to: {
            isLoaded: true,
            isInline: false,
            rawSrc: function (rawSrc) {
                return rawSrc.length < 4096;
            }
        }
    })
    .moveAssetsInOrder(moveQuery, function (asset) {
        var targetUrl = '/static/';

        return targetUrl + asset.fileName.split('.').shift() + '.' + asset.md5Hex.substr(0, 10) + asset.extension;
    })
    .writeAssetsToDisc({
        isLoaded: true
    }, 'demo')
    .writeStatsToStderr()
    .run();
```

I hope you found this introduction useful and now have some inspiration to get started with your own tools. I bet you can come up with some amazing ideas I've never thought about.
