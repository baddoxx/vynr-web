import { getAllPosts } from '@/lib/posts'

export async function GET() {
  const posts = getAllPosts()

  const urls = [
    `<url><loc>https://vynr.app/</loc></url>`,
    `<url><loc>https://vynr.app/blog</loc></url>`,
    ...posts.map(
      p => `<url><loc>https://vynr.app/blog/${p.slug}</loc></url>`
    ),
    `<url><loc>https://vynr.app/about</loc></url>`,
    `<url><loc>https://vynr.app/privacy</loc></url>`,
    `<url><loc>https://vynr.app/contact</loc></url>`,
  ]

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml' },
  })
}