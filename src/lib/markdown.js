import MarkdownIt from 'markdown-it';

// Used where markdown must be rendered to an HTML string outside Astro's own
// pipeline: index page excerpts, talk abstracts, and the RSS feed body.
const md = new MarkdownIt({
  html: true,
  linkify: true
});

export function renderMarkdown(string) {
  if (typeof string !== 'string') return '';
  return md.render(string);
}

// Extract the part of a post body above the <!--more--> marker.
export function excerpt(body = '') {
  return body.split('<!--more-->')[0];
}
