import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const dirsToClean = [
  path.join(rootDir, '.storage'),
  path.join(rootDir, 'services', 'api', '.storage'),
  path.join(rootDir, '.turbo'),
  path.join(rootDir, 'apps', 'web', '.turbo'),
  path.join(rootDir, 'services', 'api', '.turbo'),
  path.join(rootDir, 'services', 'worker', '.turbo'),
  path.join(rootDir, 'packages', 'contracts', '.turbo'),
  path.join(rootDir, 'packages', 'database', '.turbo'),
  path.join(rootDir, 'packages', 'tokens', '.turbo'),
];

console.log('🧹 Cleaning temporary directories, local test storage, and turbo caches...');

for (const dir of dirsToClean) {
  if (fs.existsSync(dir)) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`  ✓ Removed ${path.relative(rootDir, dir)}`);
    } catch (err) {
      console.warn(`  ⚠️ Could not remove ${path.relative(rootDir, dir)}: ${err.message}`);
    }
  }
}

console.log('✨ Project cleanup completed successfully.\n');

