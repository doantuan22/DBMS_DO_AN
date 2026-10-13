// Offline Internet research helper. Never imported by the application.
import fs from 'node:fs';
import path from 'node:path';
import { root, write } from './lib.mjs';

const films = [
  'Sintel',
  'Big Buck Bunny',
  'Tears of Steel',
  'Elephants Dream',
  'Cosmos Laundromat',
  'Spring Blender',
  'Sprite Fright',
  'Charge Blender',
  'Coffee Run',
  'Wing It Blender',
  'Hero Blender',
  'Caminandes Llamigos',
];
const dir = path.join(root, '.audit-output/seed-media-research');
for (const title of films) {
  const url = new URL('https://commons.wikimedia.org/w/api.php');
  url.search = new URLSearchParams({
    action: 'query',
    format: 'json',
    generator: 'search',
    gsrsearch: title + ' poster',
    gsrnamespace: '6',
    gsrlimit: '6',
    prop: 'imageinfo',
    iiprop: 'url|size|mime|extmetadata',
    iiurlwidth: '500',
  });
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(25000),
      headers: { 'User-Agent': 'CinemaStar-SeedResearch/2.0 (local educational demo)' },
    });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const json = await response.json();
    write(path.join(dir, title.replaceAll(' ', '-') + '.json'), {
      source: url.href,
      fetchedAt: new Date().toISOString(),
      response: json,
    });
    console.log(
      title,
      Object.values(json.query?.pages || {}).map((p) => ({
        title: p.title,
        url: p.imageinfo?.[0]?.thumburl,
        license: p.imageinfo?.[0]?.extmetadata?.LicenseShortName?.value,
      })),
    );
  } catch (error) {
    console.log(title, 'BLOCKED_NETWORK', error.message);
  }
}
