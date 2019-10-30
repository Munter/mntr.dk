function iso(date) {
  return date.toISOString();
}

function human(date) {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

module.exports = { human, iso };
