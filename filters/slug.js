const slugify = require('slugify');

module.exports = function(string) {
  return slugify(string, {
    replacement: '-',
    lower: true,
    remove: /[^\w\s$*_+~()'"!\-:@]/g
  });
};
