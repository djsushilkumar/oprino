import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildApp } from './app.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const app = await buildApp();
  await app.ready();
  const swaggerObject = app.swagger();
  
  const outputPath = path.join(__dirname, 'openapi.json');
  fs.writeFileSync(outputPath, JSON.stringify(swaggerObject, null, 2), 'utf-8');
  console.log(`Successfully exported OpenAPI spec to ${outputPath}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
