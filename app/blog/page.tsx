import Link from 'next/link'
import { getAllPosts } from '@/lib/posts'

export default async function BlogPage() {
  const posts = getAllPosts()

  return (
    <main style={{ maxWidth: 700, margin: '60px auto', padding: 20 }}>
      <h1>Journal</h1>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {posts.map(post => (
          <li key={post.slug} style={{ marginBottom: 24 }}>
            <Link href={`/blog/${post.slug}`}>
              <h2>{post.title}</h2>
            </Link>
            <p>{post.description}</p>
            <small>{new Date(post.date).toISOString().slice(0,10)}</small>
          </li>
        ))}
      </ul>
    </main>
  )
}