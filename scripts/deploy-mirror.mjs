import { execSync } from 'node:child_process';
import { copyFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
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

// Static routing support for /app/apk on GitHub Pages
const appApkDir = join(distDir, 'app', 'apk');
mkdirSync(appApkDir, { recursive: true });
copyFileSync(join(distDir, 'index.html'), join(appApkDir, 'index.html'));

console.log('🌐 [OFMEDIA] Pushing to ofmedia-web.github.io...');

const runGit = (cmd) => {
  try {
    return execSync(cmd, { cwd: distDir, stdio: 'pipe' });
  } catch (e) {
    return null;
  }
};

runGit('git init');
runGit('git branch -M main');
runGit('git remote remove origin');
runGit('git remote add origin https://github.com/ofmedia-web/ofmedia-web.github.io.git');
runGit('git add -A');
runGit('git commit -m "deploy: update OFMEDIA mirror"');
execSync('git push -f origin main', { cwd: distDir, stdio: 'inherit' });
console.log('✅ [OFMEDIA] Successfully published to https://ofmedia-web.github.io/');