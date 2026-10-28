import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const markdownFiles = [];

function findMarkdownFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name === 'node_modules' ||
        entry.name === '.git' ||
        entry.name === '.turbo' ||
        entry.name === 'build' ||
        entry.name === 'archived-spikes'
      ) {
        continue;
      }
      findMarkdownFiles(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      markdownFiles.push(fullPath);
    }
  }
}

findMarkdownFiles(repoRoot);

let totalLinksChecked = 0;
let brokenLinks = 0;
const failures = [];

const linkRegex = /\[(?:[^\]]*)\]\(([^)]+)\)/g;

for (const file of markdownFiles) {
  const content = fs.readFileSync(file, 'utf8');
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    let url = match[1].trim();

    // Remove quotes around title if present (e.g. [text](url "title"))
    if (url.includes(' ')) {
      url = url.split(' ')[0];
    }

    // Ignore anchors, web urls, mailto
    if (
      url.startsWith('#') ||
      url.startsWith('http://') ||
      url.startsWith('https://') ||
      url.startsWith('mailto:')
    ) {
      continue;
    }

    totalLinksChecked++;

    // Split anchor if present
    const [filePathOnly] = url.split('#');
    if (!filePathOnly) continue; // Pure anchor within same file

    const fileDir = path.dirname(file);
    const resolvedPath = path.resolve(fileDir, filePathOnly);

    if (!fs.existsSync(resolvedPath)) {
      brokenLinks++;
      failures.push({
        sourceFile: path.relative(repoRoot, file),
        linkUrl: url,
        resolvedPath: path.relative(repoRoot, resolvedPath),
      });
    }
  }
}

console.log(`\n=== Markdown Link Validation Summary ===`);
console.log(`Total relative links verified: ${totalLinksChecked}`);
console.log(`Total broken links found: ${brokenLinks}`);

if (failures.length > 0) {
  console.log(`\nBroken Link Details:`);
  for (const f of failures.slice(0, 30)) {
    console.log(
      `  ❌ In ${f.sourceFile}: "${f.linkUrl}" -> Target does not exist: ${f.resolvedPath}`,
    );
  }
  if (failures.length > 30) {
    console.log(`  ... and ${failures.length - 30} more broken links.`);
  }
  process.exit(1);
} else {
  console.log(`\n✓ All relative Markdown links resolve successfully to existing files!\n`);
  process.exit(0);
}
