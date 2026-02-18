export function GET() {
  return new Response(
    `User-agent: *
Allow: /
Sitemap: https://vynr.app/sitemap.xml`,
    {
      headers: {
        'Content-Type': 'text/plain',
      },
    }
  )
}