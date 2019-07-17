const { human, iso } = require('./filters/date');
const excerpt = require('./filters/excerpt');

module.exports = function(eleventyConfig) {
  eleventyConfig.addLayoutAlias('default', 'layouts/default.html');
  eleventyConfig.addLayoutAlias('post', 'layouts/post.html');
  eleventyConfig.addLayoutAlias('talk', 'layouts/talk.html');

  eleventyConfig.addCollection('posts', function(collection) {
    return collection.getFilteredByGlob('src/posts/*.md').reverse();
  });

  eleventyConfig.addCollection('talks', function(collection) {
    return collection.getFilteredByGlob('src/talks/*.md').reverse();
  });

  // Do this in Eleventy >=0.8.4
  // eleventyConfig.setFrontMatterParsingOptions({
  //   excerpt: true
  // });
  eleventyConfig.addFilter('excerpt', excerpt);
  eleventyConfig.addFilter('isodate', iso);
  eleventyConfig.addFilter('humandate', human);

  eleventyConfig.addPassthroughCopy('src/assets');

  return {
    templateFormats: ['md', 'html'],

    markdownTemplateEngine: 'liquid',
    htmlTemplateEngine: 'liquid',
    dataTemplateEngine: 'liquid',

    dir: {
      input: 'src',
      output: 'build'
    }
  };
};
