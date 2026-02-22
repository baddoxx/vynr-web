import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const postsDirectory = path.join(process.cwd(), 'content/blog')

export interface WineData {
  id: string
  producer?: string
  wine: string
  vintage?: string
  rating?: number
  notes?: string
  taste?: {
    brightness?: number
    aroma?: number
    structure?: number
    grip?: number
    finish?: number
  }
}

export interface PostMeta {
  slug: string
  title: string
  date: string
  type?: string
  description?: string
  canonical?: string
  heroImage?: string
  heroAlt?: string
  location?: string
  tags?: string[]
  wines?: WineData[]
}

export function getAllPosts(): PostMeta[] {
  const fileNames = fs.readdirSync(postsDirectory).filter(f => f.endsWith('.md'))

  return fileNames.map((fileName) => {
    const slug = fileName.replace(/\.md$/, '')

    const fullPath = path.join(postsDirectory, fileName)
    const fileContents = fs.readFileSync(fullPath, 'utf8')

    const { data } = matter(fileContents)

    return {
      slug,
      ...(data as Omit<PostMeta, 'slug'>)
    }
  }).sort((a, b) => (a.date < b.date ? 1 : -1))
}

export function getPostBySlug(slug: string) {
  const fullPath = path.join(postsDirectory, `${slug}.md`)
  const fileContents = fs.readFileSync(fullPath, 'utf8')

  const { data, content } = matter(fileContents)

  return {
    slug,
    content,
    ...(data as Omit<PostMeta, 'slug'>)
  }
}
