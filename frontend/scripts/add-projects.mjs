// Adds the J.C Sambo and Delight Softies websites to "Selected work" and
// moves BlinkHub to the end of the list. Asks for the admin password.
//
//   node scripts/add-projects.mjs                  (production API)
//   node scripts/add-projects.mjs http://localhost:5001
//
// Safe to re-run: a project that already exists (same name) is updated
// instead of duplicated.
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';

const here = dirname(fileURLToPath(import.meta.url));
const contentDir = join(here, '../../content');
const api = (process.argv[2] || 'https://portfolio-api-99rh.onrender.com').replace(/\/$/, '');

// Added in this order, after the existing projects and before BlinkHub
export const PROJECTS = [
  {
    screenshots: 'jcsambo',
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
  },
  {
    screenshots: 'delightsofties',
    name: 'Delight Softies Website',
    live_url: 'https://delightsofties.co.za/',
    github_url: 'git@github.com:LindseyM23/DelightSofities-Website2.git',
    technologies: 'React, Vite, React Router, Netlify',
    description: `Delight Softies Website | Tissue Brand Website and Product Showcase
Delight Softies

About the project

Delight Softies is a proudly South African tissue brand based in Polokwane, making 2-ply virgin pulp toilet rolls and other everyday tissue products that are sold in local stores such as SPAR and Best Price. The website is the brand’s main online presence, introducing the brand, showcasing its product range and community, and making it easy for households and businesses to place orders.

My role

Web Designer and Front-End Developer

What I contributed

Design and branding: designed a soft, airy look built around the brand’s blue palette, script logo and floral packaging, so the site feels like a natural extension of the product
Front-end development: built a responsive single-page site in React with Vite and React Router, with Home, About, Products and Contact sections and smooth, animated details such as a scrolling feature banner
Product showcase: presented the range, including the 18 pack 2 ply rolls, facial tissues, garage rolls and napkins, with clear “Available now” and “Coming soon” states and order calls to action
Brand story and trust: added an about section, key stats (happy clients, employees and years of experience) and a community gallery showing the products on shelves and in the hands of the team
Customer engagement: included free delivery messaging, a newsletter sign-up, an Instagram link, business hours and contact details to turn visitors into customers
Deployment: set up the site on the brand’s own domain, delightsofties.co.za

Skills demonstrated

Web design, brand-led UI, React front-end development, responsive layout, content structure, copywriting, deployment`
  }
];

function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  rl._writeToOutput = () => {}; // don't echo the password
  process.stdout.write(question);
  return new Promise(resolve => rl.question('', answer => { rl.close(); process.stdout.write('\n'); resolve(answer); }));
}

async function call(method, path, token, body) {
  const isForm = body instanceof FormData;
  const headers = { Authorization: `Bearer ${token}`, ...(body && !isForm ? { 'Content-Type': 'application/json' } : {}) };
  const res = await fetch(`${api}${path}`, { method, headers, body: isForm ? body : body && JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${data.error || ''}`);
  return data;
}

async function main() {
  const password = await ask('Admin password: ');
  const login = await fetch(`${api}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password })
  });
  if (!login.ok) { console.error(`Login failed (${login.status}).`); process.exit(1); }
  const { token } = await login.json();
  console.log('✓ logged in');

  const existing = await (await fetch(`${api}/api/projects`)).json();
  const added = [];

  for (const { screenshots, ...project } of PROJECTS) {
    console.log(`\n${project.name}`);
    const dir = join(contentDir, screenshots);
    const files = (await readdir(dir)).filter(f => /\.(jpe?g|png)$/i.test(f)).sort();
    const images = [];
    for (const f of files) {
      const form = new FormData();
      form.append('file', new Blob([await readFile(join(dir, f))], { type: 'image/jpeg' }), f);
      images.push((await call('POST', '/api/upload', token, form)).url);
      console.log(`  ✓ uploaded ${f}`);
    }
    const body = { ...project, image: images[0], images };
    const match = existing.find(p => p.name === project.name);
    const id = match
      ? (await call('PUT', `/api/projects/${match.id}`, token, body), match.id)
      : (await call('POST', '/api/projects', token, body)).id;
    console.log(`  ✓ ${match ? 'updated' : 'created'}`);
    added.push({ id, name: project.name });
  }

  // Existing projects first (current order), then the new ones, BlinkHub last
  const newNames = new Set(added.map(p => p.name));
  const others = existing.filter(p => !newNames.has(p.name) && p.name !== 'BlinkHub');
  const blink = existing.find(p => p.name === 'BlinkHub');
  const ordered = [...others, ...added, ...(blink ? [blink] : [])];
  for (const [order, p] of ordered.entries()) {
    await call('PUT', `/api/projects/${p.id}`, token, { order });
  }
  console.log('\n✓ order: ' + ordered.map(p => p.name).join(' → '));
  console.log('\nNow run `npm run snapshot` so the offline fallback includes them.');
}

// Only run when executed directly (lets other scripts import PROJECTS)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(err => { console.error('\n✗ ' + err.message); process.exit(1); });
}
