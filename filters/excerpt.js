/**
 * Extract an excerpt from the content
 *
 * @param {String} content
 *
 */
module.exports = function(content = '') {
  return content.split('<!--more-->')[0];
};
