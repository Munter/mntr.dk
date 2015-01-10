Sass @import - An anti pattern
==============================

Let me qualify that title before you go off to twitter and call me an idiot. It's not only Sass imports, it's equally Less, Stylus and your-favorite-css-preprocessor-of-the-month imports. However, if you are using CSS to actually style documents to get general fonts, margins and colors right, you are safe and i have no problem with what you are doing.

To all of you other people who are talking about reusable components/widgets/modules that somehow include CSS. To you who is a heavy user of Model View Whatever or is passionately talking about CSS encapsulation of modules with BEM or SMACSS. This is for you.



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



