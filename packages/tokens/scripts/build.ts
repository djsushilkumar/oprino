import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');
const tokensPath = path.resolve(rootDir, 'tokens.json');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

const raw = fs.readFileSync(tokensPath, 'utf-8');
const tokens = JSON.parse(raw);

// 1. Generate tokens.css
const cssLines: string[] = [
  '/**',
  ' * Oprino Brand Design Tokens (Auto-generated)',
  ' * Do not edit directly. Modify packages/tokens/tokens.json instead.',
  ' */',
  ':root {',
];

for (const [category, values] of Object.entries(tokens.color)) {
  for (const [key, val] of Object.entries(values as Record<string, string>)) {
    cssLines.push(`  --oprino-color-${category}-${key}: ${val};`);
  }
}

for (const [key, val] of Object.entries(tokens.typography.fontFamily)) {
  cssLines.push(`  --oprino-font-${key}: ${val};`);
}

for (const [key, val] of Object.entries(tokens.spacing)) {
  cssLines.push(`  --oprino-spacing-${key}: ${val};`);
}

for (const [key, val] of Object.entries(tokens.radii)) {
  cssLines.push(`  --oprino-radius-${key}: ${val};`);
}

cssLines.push('}\n');
fs.writeFileSync(path.resolve(distDir, 'tokens.css'), cssLines.join('\n'), 'utf-8');
console.log('✓ Generated dist/tokens.css');

// 2. Generate Dart Tokens for Flutter
function hexToDartColor(hex: string): string {
  const clean = hex.replace('#', '');
  return `Color(0xFF${clean.toUpperCase()})`;
}

const dartLines: string[] = [
  '// Oprino Brand Design Tokens (Auto-generated)',
  '// Do not edit directly. Modify packages/tokens/tokens.json instead.',
  '',
  "import 'package:flutter/material.dart';",
  '',
  'class OprinoColors {',
  '  OprinoColors._();',
  '',
  '  // Brand Colors',
  `  static const Color navy = ${hexToDartColor(tokens.color.brand.navy)};`,
  `  static const Color cobalt = ${hexToDartColor(tokens.color.brand.cobalt)};`,
  `  static const Color ocean = ${hexToDartColor(tokens.color.brand.ocean)};`,
  `  static const Color mint = ${hexToDartColor(tokens.color.brand.mint)};`,
  `  static const Color deepBlue = ${hexToDartColor(tokens.color.brand.deepBlue)};`,
  '',
  '  // Neutral Colors',
  `  static const Color paper = ${hexToDartColor(tokens.color.neutral.paper)};`,
  `  static const Color border = ${hexToDartColor(tokens.color.neutral.border)};`,
  `  static const Color slate = ${hexToDartColor(tokens.color.neutral.slate)};`,
  `  static const Color white = ${hexToDartColor(tokens.color.neutral.white)};`,
  `  static const Color black = ${hexToDartColor(tokens.color.neutral.black)};`,
  '',
  '  // Status Colors',
  `  static const Color success = ${hexToDartColor(tokens.color.status.success)};`,
  `  static const Color warning = ${hexToDartColor(tokens.color.status.warning)};`,
  `  static const Color danger = ${hexToDartColor(tokens.color.status.danger)};`,
  `  static const Color info = ${hexToDartColor(tokens.color.status.info)};`,
  '}',
  '',
  'class OprinoSpacing {',
  '  OprinoSpacing._();',
  '  static const double xs = 4.0;',
  '  static const double sm = 8.0;',
  '  static const double md = 16.0;',
  '  static const double lg = 24.0;',
  '  static const double xl = 32.0;',
  '  static const double xxl = 48.0;',
  '}',
  '',
  'class OprinoRadii {',
  '  OprinoRadii._();',
  '  static const double sm = 4.0;',
  '  static const double md = 8.0;',
  '  static const double lg = 12.0;',
  '  static const double xl = 16.0;',
  '  static const double full = 9999.0;',
  '}',
  '',
];

fs.writeFileSync(path.resolve(distDir, 'oprino_tokens.dart'), dartLines.join('\n'), 'utf-8');
console.log('✓ Generated dist/oprino_tokens.dart');

// 3. Copy tokens.json to dist
fs.copyFileSync(tokensPath, path.resolve(distDir, 'tokens.json'));
console.log('✓ Copied dist/tokens.json');
