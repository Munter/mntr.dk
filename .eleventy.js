const got = require('got');
const pluginRss = require('@11ty/eleventy-plugin-rss');

const { human, iso } = require('./filters/date');
const excerpt = require('./filters/excerpt');
const slug = require('./filters/slug');
const markdownFilter = require('./filters/markdown');

module.exports = function(eleventyConfig) {
  /* Markdown Plugins */
  const markdown = require('markdown-it')({
    html: true,
    linkify: true
  });

  markdown.use(require('markdown-it-anchor'));

  markdown.use(require('markdown-it-prism'));

  eleventyConfig.setLibrary('md', markdown);

  eleventyConfig.addPlugin(pluginRss);

  eleventyConfig.addLayoutAlias('default', 'layouts/default.html');
  eleventyConfig.addLayoutAlias('post', 'layouts/post.html');
  eleventyConfig.addLayoutAlias('talk', 'layouts/talk.html');

  eleventyConfig.addCollection('posts', function(collection) {
    return collection.getFilteredByGlob('src/posts/*.md').reverse();
  });

  eleventyConfig.addCollection('talks', async function(collection) {
    const col = collection.getFilteredByGlob('src/talks/*.md').reverse();

    for (const {
      data: { video }
    } of col) {
      const { service, id } = video;

      if (service === 'vimeo') {
        const { body } = await got(`https://vimeo.com/api/v2/video/${id}.json`, { json: true });
        const imageId = body[0].thumbnail_large
          .split('_')[0]
          .split('/')
          .pop();

        video['image-id'] = imageId;
      }
    }

    return col;
  });

  // Do this in Eleventy >=0.8.4
  // eleventyConfig.setFrontMatterParsingOptions({
  //   excerpt: true
  // });
  eleventyConfig.addFilter('excerpt', excerpt);
  eleventyConfig.addFilter('isodate', iso);
  eleventyConfig.addFilter('humandate', human);
  eleventyConfig.addFilter('slug', slug);
  eleventyConfig.addFilter('markdown', markdownFilter);

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
