import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import site from '../data/site.json';
import { renderMarkdown } from '../lib/markdown.js';
import { postUrl, byDateDesc } from '../lib/posts.js';

// Feed readers may resolve relative URLs inconsistently, so make links and
// images in the feed body absolute.
function absolutify(html) {
  return html.replace(/(href|src)="\//g, `$1="${site.url}/`);
}

export async function GET(context) {
  const posts = (await getCollection('posts')).sort(byDateDesc);

  return rss({
    title: site.name,
    description: site.description,
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      link: postUrl(post),
      pubDate: post.data.date,
      description: post.data.description,
      content: absolutify(renderMarkdown(post.body))
    }))
  });
}
