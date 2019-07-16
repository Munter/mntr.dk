const globby = require('globby');
const { relative, basename } = require('path');

module.exports = function(eleventyConfig) {
  eleventyConfig.addLayoutAlias('default', 'layouts/default.html');
  eleventyConfig.addLayoutAlias('post', 'layouts/post.html');
  eleventyConfig.addLayoutAlias('talk', 'layouts/talk.html');

  eleventyConfig.addCollection("allMyContent", function(collection) {
    return collection.getAll();
  });

  eleventyConfig.addCollection("posts", function(collection) {
    return collection.getFilteredByGlob("src/_posts/*.md").reverse();
  });

  eleventyConfig.addCollection("talks", function(collection) {
    return collection.getFilteredByGlob("src/_talks/*.md").reverse();
  });

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
      output: 'build'
    }
  };
};
