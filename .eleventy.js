module.exports = function(eleventyConfig) {
  eleventyConfig.addLayoutAlias('default', 'layouts/default.html');
  eleventyConfig.addLayoutAlias('post', 'layouts/post.html');
  eleventyConfig.addLayoutAlias('talk', 'layouts/talk.html');

  eleventyConfig.addCollection("posts", function(collection) {
    return collection.getFilteredByGlob("src/posts/*.md").reverse();
  });

  eleventyConfig.addCollection("talks", function(collection) {
    return collection.getFilteredByGlob("src/talks/*.md").reverse();
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
