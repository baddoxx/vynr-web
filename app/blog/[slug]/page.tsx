import { getAllPosts, getPostBySlug } from '@/lib/posts'
import { remark } from 'remark'
import html from 'remark-html'

export async function generateStaticParams() {
  const posts = getAllPosts()
  return posts.map((post) => ({ slug: post.slug }))
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const post = getPostBySlug(slug)

  const processedContent = await remark().use(html).process(post.content)
  const contentHtml = processedContent.toString()

  return (
    <main style={{ maxWidth: 700, margin: '60px auto', padding: 20 }}>
      <h1>{post.title}</h1>
      <small>{new Date(String(post.date)).toISOString().slice(0, 10)}</small>
      <article dangerouslySetInnerHTML={{ __html: contentHtml }} />
    </main>
  )
}