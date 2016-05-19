---
layout: post
title:  "Content-addressable Browser Caching"
date:   2016-05-11 10:00:00
categories:
---

What if it was possible to use content-addressable caching in browsers instead of URL-based caching? The increased cache hits would be highly beneficial, especially for sites depending on 3rd party libraries via a CDN. It turns out this **is** possible. The subresource integrity specification gives us all we need. But it turns out it's not that simple.

None of the ideas I'm describing here are new, and none of them are concieved by me. I just happened go get this idea, like many others, and tried to get the standards bodies to implement it. This lead to a lot of historical digging because much of the knowledge about this is buried in mailing lists, blog posts that only exist in historical web archives and spec maintainers heads. I'm writing this post in the hope that the next time someone gets this great idea, they won't have to do the same work I just did.


## Content-addressable

Addressing an asset based on its content rather than its location is not a new thing. [Content-addressable storage](https://en.wikipedia.org/wiki/Content-addressable_storage) has been around for a long time and is beneficial in situations where the content is known not to change. Instead of a location to reference the content, you use a cryptographic hash of the content, which iniquely identifies it.

This technique should not be new to modern web developers, as we are already partially buying into imutable files with our far-future-expires caching of files that have a hash of their content as part of their file name. A great method for both getting long time caching and full control over when to guaranteed use updated assets, because they change identity. You have probably also used content-addressable systems with git, bittorrent or bitcoin.

But even though parts of content-addressability have been adopted in the file naming regimes we are not reaping the full benefits of it in regards to cashing, since browser caches are based on URL's, not content identity.

This is where a new W3C specification that most people haven't heard of comes in.

## Subresource Integrity

The [subresource integrity specification](https://www.w3.org/TR/SRI/) describes a way for browsers to verify that the asset they have downloaded is indeed the asset that was expected. This is done by the developer declaring a cryptographic hash of the expected asset to be downloaded. When the browser has fetched the asset it compares the declared ryptographic hash with the one of the content. If there is a mismatch between the two hashes the browser will refuse to parse and evaluate the asset.

Despite the choir of people that see no value in this on reddit and hacker news, it's actually a really useful technique to secure your evaluation of 3rd party dependencies, or even your own assets. SSL will secure your transport, but nothing other than subresource intergrity ensures that the asset has not been compromised from the remote server. In situations where the static assets you depend on are hosted on a server outside of your control, like a CDN, or even just on a different machine than your main web server.

So in order to gain this extra security you use subresource integrity. It's tedious declaring these hashes, but you can use tooling to help you for this.

The clever reader will now have noticed that content-adressability and subresource integrity have two things in common. The cryptographic hash that uniquely identifies the content. So this was the idea I had:

## Content-adressable Browser Cache

If a cryptographic hash uniquely identifies the content of an asset and subresource integrity hashes are declared by the developer, why not use these hashes as indexes for caching the asset instead of a URL?

The benefits of doing this would be that you could leverage the cache across domains. Say you use jQuery 2.2.1 from a CDN on your site. If a visitor vists your site and doesn't have jQuery 2.2.1 on that URL in the browser cache it's a cache miss and a download. But what if the visitor had jQuery 2.2.1 from a **different** URL in the cache? The hashes of these two jQuery assets are identical. So if your site and the other site your visitor got jQuery 2.2.1 from both had declared an integrity hash, this would mean a cache hit because the identity hash is the same.

Awesome idea. I am by no means the first person who had it. The earliest mentions I could find about this was Douglas Crockford describing it in 2008 on a now dead URL, but summarized by [Mark Seaborn](https://github.com/mseaborn) in his [discussion of shared caching by hash](https://github.com/mseaborn/nacl-wiki/blob/master/ShareByHash.wiki#proposed-scheme). Obviously many people had thought about this before me. So why hasn't it been implemented?

I got some hints on the [whatwg IRC channel](https://wiki.whatwg.org/wiki/IRC) on where to read up on discussions about the idea. These are the reasons not to implement it:

## Timing Attacks

A timing attack is a way of extrapolating knowledge about some otherwise non-accessible piece of data by timing the duration of a specific operation. In the case of content-addressable browser cache the piece of information that is otherwise hidden is the users browser history and whether the user is logged in to certain services. The method to obtain this information is to time the duration of a HTTP fetch of a uniquely identified asset that only exists on the service you are out to gain information about. If the fetch returns immediately it is very likely that it was because of a cache hit. If it takes a few hundred milliseconds or returns an error it's likely that the user hasn't used the service you are probing for recently.

Leaking this sort of information is considered a security vulnerability. Similar vulnerabilities, like checking if a link has been visited with `Element.match(':visited')`, have been addressed to avoid enabling potential evil third parties to invulentarily track users.

However, I still haven't quite understood why timing a `fetch`-operation is a bigger problem than simply doing `<script src="https://interestingservice/asset.js" onload="trackTime()"></script>`. Perhaps some more knowledgable people will be able to elaborate on this in the comments.

## Cache Poisoning

[Cache poisoning](http://th.informatik.uni-mannheim.de/people/lucks/HashCollisions/) is the act of injecting malicious content into the users cache under a trusted name. Being able to subsitute a jQuery cache hit on a users browser with a malicious script would be of great value to an evildoer.

Since subresource integrity would already provide a guarantee that the content to be cached matches a developer defined cryptographic hash, a cache poisoning attack is fairly difficult to execute. The attacker would have to brute force generate an attack script that matches the same cryptographic hash as the intended target asset to impersonate. This alone is difficult. Further more this would have to be done for exactly the hash function that the specific site that the attacker wants to inject their script in. Chosing a strong enough hash function for your integrity hash would make this an almost impossible task in the first place.

On top of that, the attacker would have to lure a potential target user to a phishing site that references the malicious script with the integrity hash of the intended 3rd party asset to inject itself as in the cache. And of course the visitor must not have the asset already in cache, otherwise the poisoning attack will not work.

From my point of view this attack is highly unlikely, but is also potentially devastating if it can be executed. My non-knowledgeable opinion on this is that it sounds actually impossible. If the NSA can't break these algorithms I doubt many hackers are able to. Again I would like to hear from experts in the field in the comments, so this blog post can serve as a reference for future developers that have the same idea.

## Alternatives

The shared cache based in content identity was very promising, since it would create a collaborative caching ecosystem with no investment from the browsing user, nd little investment from site developers. However there are other ways to improve shared caching of 3rd party assets.

One solution is for the frontend community to come together and standardize on a single CDN so all sites reference the same URL's, thus increasing the chances of cache hits. This makes it a people problem rather than a technical one. For the same reason I see very little chance of this ever happening.

Another solution is one that the browser user themselves can opt into. The [Web Boost chrome extension](https://chrome.google.com/webstore/detail/web-boost-wait-less-brows/ahbkhnpmoamidjgbneafjipbmdfpefad) maintains a list of blessed URL's of known and popular 3rd party libraries and the content of the libraries. It intercepts requests to these URL's and serves a response from the plugins own distribution. The downside is that is the extension ever gets hacked or the author becomes a malicious actor it's very hard to know and avoid for the users that have this installed.


**References**

- https://en.wikipedia.org/wiki/Content-addressable_storage
- https://www.w3.org/TR/SRI/
- https://github.com/w3c/webappsec-subresource-integrity/issues/22
- https://lists.w3.org/Archives/Public/public-webappsec/2014Oct/0000.html
- https://github.com/mseaborn/nacl-wiki/blob/master/ShareByHash.wiki
- http://th.informatik.uni-mannheim.de/people/lucks/HashCollisions/
