import { getAllPosts } from '@/lib/posts'
import { getAllAtlasNodes, buildAtlasUrlPath } from '@/lib/atlas'

const BASE = 'https://vynr.app'

export function GET() {
  const posts = getAllPosts()

  const staticUrls = [
    `<url><loc>${BASE}/</loc></url>`,
    `<url><loc>${BASE}/blog</loc></url>`,
    ...posts.map(
      p => `<url><loc>${BASE}/blog/${p.slug}</loc></url>`
    ),
    `<url><loc>${BASE}/about</loc></url>`,
    `<url><loc>${BASE}/privacy</loc></url>`,
    `<url><loc>${BASE}/contact</loc></url>`,
  ]

  const atlasUrls = [
    `<url><loc>${BASE}/atlas</loc></url>`,
    ...getAllAtlasNodes()
      .filter(n => n.level !== 'root')
      .map(n => `<url><loc>${BASE}${buildAtlasUrlPath(n)}</loc></url>`),
  ]

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticUrls, ...atlasUrls].join('\n')}
</urlset>`

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml' },
  })
}