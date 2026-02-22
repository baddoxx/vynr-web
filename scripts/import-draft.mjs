// scripts/import-draft.mjs
//
// Import a blog draft folder (exported from vynr iOS) into the blog content structure.
// Usage: node scripts/import-draft.mjs <draft-folder> [--publish] [--force]

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { createHash } from 'crypto';

const args = process.argv.slice(2);
const draftPath = args.find(a => !a.startsWith('--'));
const publish = args.includes('--publish');
const force = args.includes('--force');

if (!draftPath) {
  console.error('Usage: node scripts/import-draft.mjs <draft-folder> [--publish] [--force]');
  process.exit(1);
}

const resolvedPath = path.resolve(draftPath);
const postMdPath = path.join(resolvedPath, 'post.md');

if (!fs.existsSync(postMdPath)) {
  console.error(`Error: ${postMdPath} not found`);
  process.exit(1);
}

// Parse frontmatter
const raw = fs.readFileSync(postMdPath, 'utf8');
const { data, content } = matter(raw);
const slug = data.slug;

if (!slug) {
  console.error('Error: no slug in frontmatter');
  process.exit(1);
}

// Slug consistency check
const folderName = path.basename(resolvedPath);
if (folderName !== slug) {
  console.error(`Error: folder name '${folderName}' does not match frontmatter slug '${slug}'`);
  process.exit(1);
}

const blogDir = path.join(process.cwd(), 'content/blog');
const publicDir = path.join(process.cwd(), 'public/journal');
const destMd = path.join(blogDir, `${slug}.md`);

// Idempotency check
if (fs.existsSync(destMd) && !force) {
  console.error(`Error: ${destMd} already exists. Use --force to overwrite.`);
  process.exit(1);
}

// Ensure directories exist
fs.mkdirSync(publicDir, { recursive: true });
fs.mkdirSync(blogDir, { recursive: true });

// Find image files
const imageFiles = fs.readdirSync(resolvedPath)
  .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
  .sort();

// Copy images with overwrite protection — preserve original extension
for (const img of imageFiles) {
  const srcPath = path.join(resolvedPath, img);
  const ext = path.extname(img).toLowerCase();
  const num = img.match(/photo-(\d+)/)?.[1] || img.replace(/\.[^.]+$/, '');
  const destName = `${slug}-${num}${ext}`;
  const destPath = path.join(publicDir, destName);

  if (fs.existsSync(destPath)) {
    const srcHash = createHash('sha256').update(fs.readFileSync(srcPath)).digest('hex');
    const destHash = createHash('sha256').update(fs.readFileSync(destPath)).digest('hex');
    if (srcHash !== destHash && !force) {
      console.error(`Error: ${destPath} exists with different content. Use --force to overwrite.`);
      process.exit(1);
    }
  }

  fs.copyFileSync(srcPath, destPath);
  console.log(`  Copied: ${img} → public/journal/${destName}`);
}

// Rewrite image paths in content — preserve original extension
let updatedContent = content;
for (const img of imageFiles) {
  const ext = path.extname(img).toLowerCase();
  const num = img.match(/photo-(\d+)/)?.[1] || img.replace(/\.[^.]+$/, '');
  const destName = `${slug}-${num}${ext}`;
  updatedContent = updatedContent.replaceAll(`./${img}`, `/journal/${destName}`);
}

// Rewrite heroImage in frontmatter — preserve extension
if (data.heroImage && data.heroImage.startsWith('./')) {
  const heroFile = data.heroImage.replace('./', '');
  const ext = path.extname(heroFile).toLowerCase();
  const num = heroFile.match(/photo-(\d+)/)?.[1] || heroFile.replace(/\.[^.]+$/, '');
  data.heroImage = `/journal/${slug}-${num}${ext}`;
}

// Strip DRAFT comments in --publish mode
// Use [\s\S] instead of . for multiline safety
if (publish) {
  updatedContent = updatedContent.replace(/<!--\s*DRAFT:[\s\S]*?-->\s*/g, '');
  console.log('  Stripped DRAFT comments');
}

// Write final markdown
// NOTE: --force overwrites post.md unconditionally (no hash check unlike images).
// If you've hand-edited the imported markdown, re-importing with --force will lose those edits.
const finalMd = matter.stringify(updatedContent.trim() + '\n', data);
fs.writeFileSync(destMd, finalMd, 'utf8');
console.log(`  Written: content/blog/${slug}.md`);
console.log('Done.');
