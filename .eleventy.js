const pluginRss = require('@11ty/eleventy-plugin-rss');

const { human, iso } = require('./filters/date');
const excerpt = require('./filters/excerpt');
const slug = require('./filters/slug');
const markdown = require('./filters/markdown');

module.exports = function(eleventyConfig) {
  eleventyConfig.addPlugin(pluginRss);

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
  eleventyConfig.addFilter('slug', slug);
  eleventyConfig.addFilter('markdown', markdown);

  eleventyConfig.addPassthroughCopy('src/assets');
  eleventyConfig.addPassthroughCopy('src/favicon.ico');

  return {
    templateFormats: ['md', 'html', 'njk'],

    markdownTemplateEngine: 'liquid',
    htmlTemplateEngine: 'liquid',
    dataTemplateEngine: 'liquid',

    dir: {
      input: 'src',
      output: 'build'
    }
  };
};
