const md = require('markdown-it')();

module.exports = function(string) {
  return md.render(string);
};
