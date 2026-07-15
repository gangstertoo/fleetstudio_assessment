import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverDir = path.resolve(__dirname, '..');
const clientDistDir = path.resolve(serverDir, '..', 'client', 'dist');
const publicDir = path.join(serverDir, 'public');

if (!fs.existsSync(clientDistDir)) {
    throw new Error(`Client build output not found at ${clientDistDir}`);
}

fs.rmSync(publicDir, { recursive: true, force: true });
fs.mkdirSync(publicDir, { recursive: true });

for (const entry of fs.readdirSync(clientDistDir, { withFileTypes: true })) {
    const srcPath = path.join(clientDistDir, entry.name);
    const destPath = path.join(publicDir, entry.name);
    fs.cpSync(srcPath, destPath, { recursive: true });
}

console.log(`Copied client build from ${clientDistDir} to ${publicDir}`);
