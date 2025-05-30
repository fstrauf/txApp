import { MetadataRoute } from 'next'
import { getSortedPostsData } from '@/lib/posts'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.expensesorted.com'
  
  // Get all blog posts
  const posts = getSortedPostsData()
  
  console.log(`[Blog Sitemap] Generating blog sitemap with ${posts.length} posts`)
  
  // Blog-specific sitemap with enhanced metadata
  const blogPages: MetadataRoute.Sitemap = [
    // Blog index page
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    // Individual blog posts
    ...posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.lastModified ? new Date(post.lastModified) : new Date(post.date),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))
  ]

  return blogPages
}
