const md = require('markdown-it')();

module.exports = function(str) {
  if (typeof str === 'string') {
    return md.render(str);
  }
};
