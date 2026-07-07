import slugify from 'slugify';

// Same slugify options as the old Eleventy `slug` filter, to keep the
// /{year}/{slug}/ post URLs identical.
export default function slug(string) {
  return slugify(string, {
    replacement: '-',
    lower: true,
    remove: /[^\w\s$*_+~()'"!\-:@]/g
  });
}
