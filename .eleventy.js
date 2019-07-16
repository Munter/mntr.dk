const globby = require('globby');
const { relative, basename } = require('path');

module.exports = function(eleventyConfig) {
  eleventyConfig.addLayoutAlias('default', 'layouts/default.html');
  eleventyConfig.addLayoutAlias('post', 'layouts/post.html');
  eleventyConfig.addLayoutAlias('talk', 'layouts/talk.html');

  return {
    templateFormats: [
      "md",
      "html"
    ],

    markdownTemplateEngine: "liquid",
    htmlTemplateEngine: "liquid",
    dataTemplateEngine: "liquid",

    dir: {
      input: 'src',
      output: 'build',
      includes: 'foo'
    }
  };
};
