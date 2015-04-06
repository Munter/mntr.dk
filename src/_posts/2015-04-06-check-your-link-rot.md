---
layout: post
title:  "Check your link rot"
date:   2015-04-06 23:10:29
categories: web development link url link-rot hyperlink regressions jenkins
---

When we develop websites we often take the greatest care that all details are right. People are checking the design, the implementation, the responsiveness, the performance, and hordes of people are clicking all the links so ensure that everything is as it should be. We congratulate each other, high five our team, put our work in production and move on to other things.

However our perfectly crafted website is now all but a snapshot of a distant past. As we move on, the pages stick around and become a part of the ever growing public record of the internet. But even though the site was perfect when concieved it's now in a new state. Decay. From now on things can only get worse.


## Link-rot

Even though [Cool URIs don't change](http://www.w3.org/Provider/Style/URI.html), we ocasionally do link to bad URLs. Not that we know they are bad when we create our links. Maybe they have been good links all along. But then suddenly things happen. Companies go bankrupt, people lose interest in their blogs, domain renewal is forgotten, things are deleted, URLs change in a refactoring or one of a thousand other reasons or non-reasons people have, resulting in the URL you linked to being dead.

Worst case is having a page with good information, engaging users so they want to learn more, but when clicking they end up with a [404](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) or [500](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.5) error. You certainly want to avoid that.

Also more subtle things creep in all over the place, and might actually have been there from the start because manual tests don't reveal them.

Redirects can cause slow downs in page navigation. If you are not careful they might even slow down your own internal page navigation, or even worse your static assets. Having [301](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.3.2) or [302](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.3.3) redirects to your own navigation is detrimental to your page performance as you are essentially doubling or tripling each page requests time to first byte, also known as the bottleneck that causes your user to become impatient and switch context. If you have succeeded in actually showing your users the content they were looking for and they are makign the investment to navigate to other pages, you certainly don't want to keep them waiting.

## Dealing with redirects

Some redirects are good and some are bad. As a general rule, if you and everyone else uses redirects correctly you should never have a link to a 301 redirect. 301's are supposed to be permanent, giving you a guarantee that the content will always be foudn at the redirect target and never at the URL you requestted. In the ideal case you should rewrite the URL in your html immediately when a 301 is encountered to speed up navigation.

302 temporary redirects are generally tougher to deal with. Try to reduce the amount you have inside your own site, but some probably can't be removed entirely. If you are running a multi language site you probably want content negotiation on your site root respond with 302 to redirect the client to the language specific version of your site. If you have a series of multiple 302 redirects you should take a look at your server setup though.

302 redirects by external parties are generally difficult to reason about and you probably can't avoid linking to them unless you do some research to figure out what the other party is doing and if it's safe to link directly to the redirect target.

There are lots of cases where it's easy to cause accidental redirect chains when we create web pages. Some times we type `http://example.com` in the URL and it gets redirected to `http://example.com/` (trailing slash). That one is most certainly a pure waste of your visitors time.

Another common one these days is the target switching to TLS on their sites, causing a redirect from `http` to `https`. If you are really unlucky you'll hit a chain of `http -- 301 --> https`, no trailing slash `-- 301 -->` trailing slash, `/ -- 302 --> /en/`. The first two could be completely avoided.

## Tools to the rescue

Dealing with the thousands of links we all generate over a full career as web developers or copy writers is an impossible manual task. We need to use tools to help us keep our references fresh.

While dealing with this problem myself I wrote a quick tool to detect broken links. It turned out that I ended up getting a lot of extra functionality almost for free, so it wasn't much hassle to also start detecting redirect chains like the inefficient one from the last example. I figured that I am not the only one dealing with this problem, so I decided to finally put some polish on what started out as a quick hack, so it can be used by others as well.

The tool is [Hyperlink](https://github.com/Munter/hyperlink).

I used [Assetgraph](https://github.com/assetgraph/assetgraph), which I know quite well, to set up the scraping and static analysis of all pages and assets. Hyperlink starts our by populating your internal pages and assets, where internal is defined as anything on the same domain. When that part is done it starts scraping all outgoing URLs. Any warning or error encountered on the way is treated as an error condition, including inefficient redirect chains.

The current version (2.0.0 as of this writing) only looks at inefficient redirect chains for outgoing links, but an upcoming version will look at inefficient redirects in all types of URLs.

I decided to make the output of Hyperlink follow the [Test Anything Protocol](https://testanything.org/), which looks like this:

```
TAP version 13
# Crawling internal assets
ok 1 loading https://mntr.dk/
ok 2 loading https://mntr.dk/favicon.ico
ok 3 loading https://mntr.dk/assets/images/favicon/152.png
ok 4 loading https://mntr.dk/assets/images/favicon/144.png
ok 5 loading https://mntr.dk/assets/images/favicon/120.png
...
not ok 123 URI should have no redirects - http://www.milwaukeepolicenews.com/
  ---
    operator: error
    expected: "200 http://www.milwaukeepolicenews.com/"
    actual:   "ECONNRESET http://www.milwaukeepolicenews.com/"
  ...

```

The above example is reduced, but both shows successes and an error. If Hyperlink encounters any errors the exit code of the process will be the number of errors encountered. This means Hyperlink fits well into command line chains, Continuous Integration setups and similar tooling.

The TAP output is very close to human readable, but can be further improved by piping the output to any of these wonderful TAP formatters: [tap-colorize](https://www.npmjs.com/package/tap-colorize), [tap-difflet](https://www.npmjs.com/package/tap-difflet), [tap-dot](https://www.npmjs.com/package/tap-dot), [tap-json](https://www.npmjs.com/package/tap-json), [tap-min](https://www.npmjs.com/package/tap-min), [tap-nyan](https://www.npmjs.com/package/tap-nyan), [tap-spec](https://www.npmjs.com/package/tap-spec), [tap-xunit](https://www.npmjs.com/package/tap-xunit)

Formatting can be done like so: `hyperlink https://mntr.dk | tap-colorize`

## Jenkins integration

Obviously running command line tools manually is only fun the first few times, then the novelty subsides and you'd rather do other things. Luckily these days we can get robots to do our dirty work. Where I work we use [Jenkins](https://jenkins-ci.org/), but any CI setup should be able to easily do the same. Here's how I set up an automated task with Jenkins.

I want to keep my company site links fresh, but I don't need to run link checks on every deploy. On the other hand link rot can happen even when my site is not updated, so the ideal strategy for me is to set up a periodical build, which I chose in the "Build Triggers" section of my task. I chose to go with a daily check at 5am, a time where our CI is usually not busy. The cron schedule for this is simple: `H 5 * * *`

The "Build" section of the task is pretty simple. It's a single "Execute shell" block with this content:

```
npm install hyperlink tap-dot
node_modules/.bin/hyperlink https://podio.com/site -r | tee site.tap | node_modules/.bin/tap-dot
```

The only little piece of magic going on here is in `tee site.tap`. [Tee](https://www.gnu.org/software/coreutils/manual/html_node/tee-invocation.html) is a very useful little tool that lets you write `stdin` to a file, while also piping it to `stdout`. This enables me to save the TAP report for later analysis but also get a useful log output in the log section of the running task. In my case I only care for the failing tests and to see things are running, so [tap-dot](https://www.npmjs.com/package/tap-dot) is fine for me in the log output.

In the "Post-build Actions" section I added a [Publish TAP Results](https://wiki.jenkins-ci.org/display/JENKINS/TAP+Plugin) block and configured it with `site.tap`. This generates a decent looking report I can use for later. This also generates a nice graph for me on the tasks status page, giving me an overview of changes over time.

I haven't set up any alert actions yet, as this is pretty new and there still might be false negatives that need to be weeded out. But it's a very good starting point and was quick to set up. So now I have a daily report of broken or inefficient links on my site including the ability to detect changes over time.

## Looking into the future

I'm hoping to leverage the fact that Assetgraph is already modelling redirects as assets. This will let me detect all redirects from all URLs in the entire dependency graph. Eventually this could mean that it would be possible to either suggest patches or actually directly update the source files that have inefficient URLs, assuming they are static files and you run Hyperlink against the local files.

There are a few improvements to be done still. Most of them are about strengthening Assetgraph to support this specific use case better. It might be useful to be able to have the output copied to your clipboard for later use if you run the tool manually for example.

What other ideas do you have for a tool that helps you keep your link rot at bay?
