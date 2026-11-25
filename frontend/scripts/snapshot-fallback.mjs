// Pulls the current live portfolio content and images into the frontend,
// so the site can still show them when the API / database is down.
//
//   npm run snapshot                    (uses the production API)
//   npm run snapshot -- http://localhost:5001
//
// Writes src/app/data/fallback-data.json and src/assets/fallback/media/*.
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const api = (process.argv[2] || 'https://portfolio-api-99rh.onrender.com').replace(/\/$/, '');
const dataFile = join(root, 'src/app/data/fallback-data.json');
const mediaDir = join(root, 'src/assets/fallback/media');

const endpoints = {
  socialLinks: 'social-links',
  about: 'about',
  skills: 'skills',
  services: 'services',
  certifications: 'certifications',
  experience: 'experience',
  projects: 'projects',
  kpis: 'kpis',
  contact: 'contact'
};

const EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp', 'image/svg+xml': 'svg' };

async function get(url, tries = 5) {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return res;
      throw new Error(`${res.status} ${res.statusText}`);
    } catch (err) {
      if (i >= tries) throw new Error(`${url}: ${err.message}`);
      console.log(`  retrying ${url} (${err.message})`);
      await new Promise(r => setTimeout(r, i * 3000)); // gives a sleeping host time to wake
    }
  }
}

const data = {};
for (const [key, path] of Object.entries(endpoints)) {
  data[key] = await (await get(`${api}/api/${path}`)).json();
  console.log(`✓ ${path}`);
}

// Download every DB-stored image and point the data at the local copy
let json = JSON.stringify(data, null, 2);
const ids = [...new Set([...json.matchAll(/\/api\/media\/([A-Za-z0-9_-]+)/g)].map(m => m[1]))];
await rm(mediaDir, { recursive: true, force: true });
await mkdir(mediaDir, { recursive: true });
const local = {};
for (const id of ids) {
  const res = await get(`${api}/api/media/${id}`);
  const type = (res.headers.get('content-type') || '').split(';')[0].trim();
  const file = `${id}.${EXT[type] || 'bin'}`;
  await writeFile(join(mediaDir, file), Buffer.from(await res.arrayBuffer()));
  local[id] = `assets/fallback/media/${file}`;
}
json = json.replace(/\/api\/media\/([A-Za-z0-9_-]+)/g, (_, id) => local[id]);
await writeFile(dataFile, json + '\n');

console.log(`✓ ${ids.length} images → src/assets/fallback/media (${(await readdir(mediaDir)).length} files)`);
console.log('Fallback updated. Rebuild and redeploy the frontend to ship it.');
