#!/usr/bin/env node
/**
 * Stitch Fetcher: downloads a given Stitch project's screen assets via curl -L.
 * Usage:
 *   node scripts/fetch-stitch-screens.js --project <projectId> --screen <screenId> [--out <output-dir>]
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function usage() {
  console.log('Usage: node scripts/fetch-stitch-screens.js --project <projectId> --screen <screenId> [--out <output-dir>]');
}

const args = process.argv.slice(2);
const opts = {};
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a.startsWith('--')) {
    const key = a.substring(2);
    const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
    opts[key] = val;
  }
}

if (!opts.project || !opts.screen) {
  console.error('Error: project and screen are required.');
  usage();
  process.exit(2);
}

const manifestPath = path.resolve('config', 'stitch-manifest.json');
if (!fs.existsSync(manifestPath)) {
  console.error(`Manifest not found at ${manifestPath}`);
  console.error('Create a manifest with project/screen URLs before using this tool.');
  process.exit(3);
}

let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
} catch (e) {
  console.error('Failed to parse manifest:', e.message);
  process.exit(4);
}

const project = manifest?.projects?.[opts.project]?.screens?.[opts.screen];
if (!project) {
  console.error(`No URLs found for project ${opts.project} screen ${opts.screen} in manifest.`);
  process.exit(5);
}

const outDir = opts.out ? path.resolve(opts.out) : path.resolve(process.cwd(), 'stitches', opts.project, opts.screen);
fs.mkdirSync(outDir, { recursive: true });

function curlDownload(url, dest) {
  const fname = path.basename(new URL(url).pathname) || 'download';
  const outPath = path.join(dest, fname);
  const cmd = `curl -L -o ${JSON.stringify(outPath)} ${JSON.stringify(url)}`;
  console.log(`Downloading ${url} -> ${outPath}`);
  execSync(cmd, { stdio: 'inherit' });
}

try {
  if (project.image) {
    curlDownload(project.image, outDir);
  } else {
    console.warn('No image URL found for this screen in manifest.');
  }
  if (project.code) {
    curlDownload(project.code, outDir);
  } else {
    console.warn('No code URL found for this screen in manifest.');
  }
  console.log('Stitch screen fetch complete.');
} catch (e) {
  console.error('Failed to fetch stitch screens:', e?.message || e);
  process.exit(6);
}
