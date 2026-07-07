// Resolve a Vimeo video's thumbnail id on the i.vimeocdn.com CDN at build
// time. The templates construct concrete image URLs from it, e.g.
// https://i.vimeocdn.com/video/{image-id}_640.jpg
//
// A frontmatter `video.image-id` takes precedence, which is the escape hatch
// for videos that have been deleted from Vimeo.
const cache = new Map();

async function vimeoImageId(id) {
  if (cache.has(id)) return cache.get(id);

  let imageId = null;

  const response = await fetch(
    `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(`https://vimeo.com/${id}`)}`
  );

  if (response.ok) {
    const { thumbnail_url } = await response.json();
    // e.g. https://i.vimeocdn.com/video/819916867-a5984…92-d_295x166?region=us
    imageId = thumbnail_url.split('/').pop().split('_')[0];
  } else {
    console.warn(`vimeo oEmbed lookup failed for video ${id}: HTTP ${response.status}`);
  }

  cache.set(id, imageId);
  return imageId;
}

export async function resolveVideo(video) {
  if (!video || video.service !== 'vimeo' || video['image-id']) return video;

  return { ...video, 'image-id': await vimeoImageId(video.id) };
}
