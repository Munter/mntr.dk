import slug from './slug.js';

export function postUrl(post) {
  return `/${post.data.date.getFullYear()}/${slug(post.data.title)}/`;
}

export function byDateDesc(a, b) {
  return b.data.date - a.data.date;
}
