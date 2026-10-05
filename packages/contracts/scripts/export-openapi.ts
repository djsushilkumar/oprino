import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateOpenApiDocument } from '../src/openapi.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

const spec = generateOpenApiDocument();
const specJson = JSON.stringify(spec, null, 2);

fs.writeFileSync(path.resolve(distDir, 'openapi.json'), specJson + '\n', 'utf-8');
fs.writeFileSync(path.resolve(rootDir, 'openapi.json'), specJson + '\n', 'utf-8');

console.log('✓ Exported OpenAPI 3.1 specification to dist/openapi.json');
