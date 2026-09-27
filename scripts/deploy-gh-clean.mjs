import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const scratchDir = 'C:\\Users\\DomPC\\.gemini\\antigravity\\scratch';
const distDir = path.join(scratchDir, 'ofmedia-web', 'dist');

// 1. Deploy for ofmedia.online (ofmedia-web.github.io)
console.log('--- Preparing deploy for ofmedia.online ---');
const deployOnline = path.join(scratchDir, 'deploy-online');
if (fs.existsSync(deployOnline)) fs.rmSync(deployOnline, { recursive: true, force: true });
fs.cpSync(distDir, deployOnline, { recursive: true });
fs.writeFileSync(path.join(deployOnline, 'CNAME'), 'ofmedia.online\n');

execSync('git init -b main', { cwd: deployOnline, stdio: 'inherit' });
execSync('git config user.name "Vanafps"', { cwd: deployOnline, stdio: 'inherit' });
execSync('git config user.email "troyanivirus@gmail.com"', { cwd: deployOnline, stdio: 'inherit' });
execSync('git add -A', { cwd: deployOnline, stdio: 'inherit' });
execSync('git commit -m "Deploy clean build without Telegram for ofmedia.online"', { cwd: deployOnline, stdio: 'inherit' });
execSync('git -c http.proxy="" -c https.proxy="" push -f https://github.com/ofmedia-web/ofmedia-web.github.io.git main:main', { cwd: deployOnline, stdio: 'inherit' });
console.log('Successfully deployed to ofmedia-web.github.io!');

// 2. Deploy for hd.ofmedia.ru (ofmedia-web/hd)
console.log('--- Preparing deploy for hd.ofmedia.ru ---');
const deployHd = path.join(scratchDir, 'deploy-hd');
if (fs.existsSync(deployHd)) fs.rmSync(deployHd, { recursive: true, force: true });
fs.cpSync(distDir, deployHd, { recursive: true });
fs.writeFileSync(path.join(deployHd, 'CNAME'), 'hd.ofmedia.ru\n');

execSync('git init -b main', { cwd: deployHd, stdio: 'inherit' });
execSync('git config user.name "Vanafps"', { cwd: deployHd, stdio: 'inherit' });
execSync('git config user.email "troyanivirus@gmail.com"', { cwd: deployHd, stdio: 'inherit' });
execSync('git add -A', { cwd: deployHd, stdio: 'inherit' });
execSync('git commit -m "Deploy clean build without Telegram for hd.ofmedia.ru"', { cwd: deployHd, stdio: 'inherit' });
execSync('git -c http.proxy="" -c https.proxy="" push -f https://github.com/ofmedia-web/hd.git main:main', { cwd: deployHd, stdio: 'inherit' });
console.log('Successfully deployed to ofmedia-web/hd!');
