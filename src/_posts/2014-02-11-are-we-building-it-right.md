---
layout: post
title:  "Are we building it right?"
date:   2014-02-11 19:15:29
categories: web development performance assetgraph
---

= Are we building it right?


== Development code ≠ Production code
I start from the assumption that you know how important it is to optimize your web pages and applications. If you are not on board with this, you might want to read Steve Souders's [14 Rules for Faster-Loading Web Sites](http://stevesouders.com/hpws/rules.php) as this is the premise for most web build systems in existance.

If you follow all the performance optimization rules that performance researchers have proven are fastest, you will eventually need some sort of automation that can take your code and build it into something that can be pushed very quickly over the wire. The reason for this is that web asset optimized for quick wire transfer and optimal machine consumption are very unsuited for human consumtion. These are some of the traits of web code in development and production:

Development code: readable, maintainable, seperated, slow
Production code: unreadable, unmaintainable, bundled, fast

So to have an optimal development experience you need a setup where you can concentrate on writing beautifully structured, well docmented and easily readable code, while at the same time being able to deliver the site over the network in a fraction of a second in order not to frustrate your visitors. Ideally the transformation from development code to production code should be fully automated to the point where you, or your Continuous Integration server, can trigger the transformation with the simplest flick of a switch.

