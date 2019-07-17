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
  eleventyConfig.addFilter('excerpt', (content = '') => content.split('<!--more-->')[0]);

  eleventyConfig.addFilter('isodate', date => date.toISOString());
  eleventyConfig.addFilter('humandate', date => {
    console.log('date', date);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  });

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
