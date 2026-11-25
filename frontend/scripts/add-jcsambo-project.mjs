// One-off: adds the J.C Sambo Attorneys website to "Selected work" and moves
// BlinkHub to the end of the list. Asks for the admin password when run.
//
//   node scripts/add-jcsambo-project.mjs                 (production API)
//   node scripts/add-jcsambo-project.mjs http://localhost:5001
//
// Safe to re-run: if a project with the same name exists it is updated
// instead of duplicated.
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';

const here = dirname(fileURLToPath(import.meta.url));
const shotsDir = join(here, '../../content/jcsambo');
const api = (process.argv[2] || 'https://portfolio-api-99rh.onrender.com').replace(/\/$/, '');

const project = {
  name: 'J.C Sambo Attorneys Website',
  live_url: 'https://jcsambo.netlify.app/',
  github_url: 'git@github.com:LindseyM23/J.CSambo-website.git',
  technologies: 'React, Vite, React Router, Netlify',
  description: `J.C Sambo Attorneys Website | Law Firm Website and Client Enquiry Platform
J.C Sambo Attorneys Inc.

About the project

J.C Sambo Attorneys Inc. is a South African law firm with offices in Polokwane and Nelspruit. The website is the firm’s main online presence, presenting its practice areas, values and contact details to people looking for legal help. It is designed to feel trustworthy and approachable, explain the law in plain language and make it easy for clients to get in touch, including for urgent matters such as arrests over weekends.

My role

Web Designer and Front-End Developer

What I contributed

Design and branding: designed a refined, editorial look with a warm bronze palette, classical imagery and elegant typography that reflects the firm’s professionalism and its promise of “Your Attorney. Your Ally.”
Front-end development: built a fast, responsive single-page site in React with Vite and React Router, covering Home, About Us, What We Do and Contact pages
Practice areas: structured 14 areas of law into 4 disciplines, with a filterable practice index and detailed descriptions so visitors can quickly find the help they need
Content and messaging: wrote and organised client-focused content, including the firm’s story, values (integrity, confidentiality, accountability and transparency) and community commitment
Client enquiries: built a contact page with telephone, office details and an enquiry form that sends matters directly to the firm, with clear guidance for urgent cases
SEO and deployment: added search and social sharing metadata and deployed the site on Netlify

Skills demonstrated

Web design, React front-end development, responsive layout, UX and content structure, copywriting, SEO, deployment`
};

function ask(question, hidden = false) {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  if (hidden) rl._writeToOutput = () => {}; // don't echo the password
  return new Promise(resolve => {
    if (hidden) process.stdout.write(question);
    rl.question(question, answer => { rl.close(); if (hidden) process.stdout.write('\n'); resolve(answer); });
  });
}

async function call(method, path, token, body) {
  const headers = { Authorization: `Bearer ${token}` };
  if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${api}${path}`, {
    method, headers, body: body instanceof FormData ? body : body && JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${data.error || ''}`);
  return data;
}

const password = await ask('Admin password: ', true);
const login = await fetch(`${api}/api/auth/login`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password })
});
if (!login.ok) { console.error(`Login failed (${login.status}).`); process.exit(1); }
const { token } = await login.json();
console.log('✓ logged in');

// 1. Upload screenshots (in display order: home hero first)
const files = (await readdir(shotsDir)).filter(f => /\.(jpe?g|png)$/i.test(f)).sort();
const images = [];
for (const f of files) {
  const form = new FormData();
  form.append('file', new Blob([await readFile(join(shotsDir, f))], { type: 'image/jpeg' }), f);
  images.push((await call('POST', '/api/upload', token, form)).url);
  console.log(`✓ uploaded ${f}`);
}

// 2. Create (or update) the project
const existing = await (await fetch(`${api}/api/projects`)).json();
const match = existing.find(p => p.name === project.name);
const body = { ...project, image: images[0], images };
let id;
if (match) {
  await call('PUT', `/api/projects/${match.id}`, token, body);
  id = match.id;
  console.log('✓ updated existing J.C Sambo project');
} else {
  id = (await call('POST', '/api/projects', token, body)).id;
  console.log('✓ created J.C Sambo project');
}

// 3. Reorder: keep current order, J.C Sambo before BlinkHub, BlinkHub last
const others = existing.filter(p => p.id !== id && p.name !== 'BlinkHub');
const blink = existing.find(p => p.name === 'BlinkHub');
const ordered = [...others, { id, name: project.name }, ...(blink ? [blink] : [])];
for (const [order, p] of ordered.entries()) {
  await call('PUT', `/api/projects/${p.id}`, token, { order });
}
console.log('✓ order: ' + ordered.map(p => p.name).join(' → '));
console.log('\nNow run `npm run snapshot` so the offline fallback includes it.');
