#!/usr/bin/env node
/* Lightweight OpenCode Duffr: show git diffs for given paths or whole repo */
import { execSync } from 'child_process';
const args = process.argv.slice(2);

function die(msg) {
  console.error(msg);
  process.exit(1);
}

try {
  const hasPaths = args.length > 0;
  // Always show a header for context
  console.log('OpenCode Duffr: git diff');
  if (hasPaths) {
    // Quote each path to handle spaces safely
    const paths = args.map(p => `'${p}'`).join(' ');
    const cmd = `git diff HEAD -- ${paths}`;
    const out = execSync(cmd, { stdio: 'inherit' });
    process.stdout.write('');
  } else {
    const cmd = 'git diff HEAD';
    const out = execSync(cmd, { stdio: 'inherit' });
    process.stdout.write('');
  }
} catch (err) {
  die('Failed to generate diff. Ensure this is run inside a Git repository and Git is available.');
}
