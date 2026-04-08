import { getAllPosts } from '@/lib/posts'
import { getAllAtlasNodes, getAtlasNode } from '@/lib/atlas'
import type { AtlasNode } from '@/lib/atlas'

const BASE = 'https://vynr.app'

/** Walk from a node up to root, collecting canonicalKeys to build the URL path. */
function buildAtlasUrlPath(node: AtlasNode): string {
  const segments: string[] = []
  let current: AtlasNode | undefined = node
  while (current && current.level !== 'root') {
    segments.push(current.canonicalKey)
    current = current.parentId ? getAtlasNode(current.parentId) : undefined
  }
  segments.reverse()
  return `/atlas/${segments.join('/')}`
}

export async function GET() {
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