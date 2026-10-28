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
        entry.name === 'build'
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

let totalReplacements = 0;
let modifiedFiles = 0;

for (const file of markdownFiles) {
  const content = fs.readFileSync(file, 'utf8');
  if (!content.includes('file:///workspace/oprino/')) {
    continue;
  }

  const fileDir = path.dirname(file);
  let fileReplacements = 0;

  const newContent = content.replace(
    /file:\/\/\/workspace\/oprino\/([^\s)"']+)/g,
    (match, relPath) => {
      fileReplacements++;
      totalReplacements++;

      const targetFullPath = path.join(repoRoot, relPath);
      let relativePath = path.relative(fileDir, targetFullPath).replace(/\\/g, '/');

      // If relative path doesn't start with . or .., prefix with ./ for clarity
      if (!relativePath.startsWith('.')) {
        relativePath = './' + relativePath;
      }

      return relativePath;
    },
  );

  if (fileReplacements > 0) {
    fs.writeFileSync(file, newContent, 'utf8');
    modifiedFiles++;
    console.log(`Updated ${path.relative(repoRoot, file)}: ${fileReplacements} links converted`);
  }
}

console.log(
  `\n✓ Conversion complete! ${totalReplacements} nonportable links converted across ${modifiedFiles} files.`,
);
