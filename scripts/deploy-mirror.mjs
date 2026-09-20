import { execSync } from 'node:child_process';
import { copyFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

console.log('🚀 [OFMEDIA] Building production bundle...');
execSync('npm run build', { stdio: 'inherit' });

console.log('📦 [OFMEDIA] Preparing mirror files...');
const distDir = join(process.cwd(), 'dist');
const public404 = join(process.cwd(), 'public', '404.html');
const dist404 = join(distDir, '404.html');

if (existsSync(public404)) {
  copyFileSync(public404, dist404);
}
writeFileSync(join(distDir, '.nojekyll'), '');

console.log('🌐 [OFMEDIA] Pushing to ofmedia-web.github.io...');
const gitCommands = [
  'git init',
  'git branch -M main',
  'git remote remove origin || true',
  'git remote add origin https://github.com/ofmedia-web/ofmedia-web.github.io.git',
  'git add -A',
  'git commit -m "deploy: update OFMEDIA mirror"',
  'git push -f origin main'
].join(' && ');

execSync(gitCommands, { cwd: distDir, stdio: 'inherit' });
console.log('✅ [OFMEDIA] Successfully published to https://ofmedia-web.github.io/');