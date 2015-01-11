---
layout: post
title:  "Sass @import - An anti pattern"
date:   2015-01-11 02:25:29
categories: sass less stylus css import antipattern
twittertext: ""
---

Let me qualify that title, and maybe make you even more upset, before you go off to twitter and call me an idiot. It's not only SASS imports, it's equally Less, Stylus and your-favorite-css-preprocessor-of-the-month imports. However, if you are using CSS to actually style documents to get general fonts, margins and colors right, you are safe and i have no problem with what you are doing.

To all of you other people who are talking about reusable components, widgets or modules that somehow include CSS. To you who is a heavy user of Model View Whatever or is passionately talking about CSS encapsulation of modules with BEM or SMACSS. This is for you.



Stylesheet vs Component
-----------------------

CSS was originally intended for styling documents, and while the whole concept of the cascade and page flow may not seem intuitive to any beginner, it is what we have and does its job reasonably well. The cascade is actually useful when controlling the most basic building blocks of styling, like typography and colors.

This is where the notion of a stylesheet really makes sense. It might even make sense for higher level layout definitions that are general to a page. Styesheets like these are what create the general feel of the page, and they are also the ones where you can change the general color scheme in one fell swoop and impress your boss when he wants you to make things "pop".

There has long been a new school of web UI though. It is a part of the whole component movement that strives to create minimal, self encapsulated, reusable and composeable UI components. If you've been in the game for a while you might have known these as widgets and if you're up to date you might call them web components. While web components are not entirely here yet for mass consumption, every larger MV* framework or library has embraced the idea or these reusable units.

These components are what have inspired methodologies like BEM or SMACSS, which again would have been impossible to follow with intact developer sanity, had it not been for SASS, Less or Stylus. The most common core theme in these methodologies is encapsulation. In big applications the cascade can be such a daunting opponent that I would personally argue CSS is a much harder thing to organize these days than javascript is.

So we encapsulate.

Except, CSS doesn't have encapsulation until we get web components. So we hack it. A class selector as a name space. So this now allows you to have a simpler flat selector hierarchy and simply import the styles of your component into your stylesheet.

This is where most developers use `@import`, and this is where the problems start.




- dependency graph
-- image css left, js right
-- css is a dependency of the template it applies to
-- encapsulation in web components
-- encapsulation via preprocessors having access to template and css

- premature optimization
-- bundling in development
--- adds complexity
--- requires tools like source maps to reverse
-- optimization is a network delivery problem and should be handled there

- destroys urls
-- where is the file is I have several include paths?

- easy vs simple
-- imports are easy, not simple
-- urls are simple



