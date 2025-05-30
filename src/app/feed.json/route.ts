import { getSortedPostsData } from '@/lib/posts'

export async function GET() {
  const posts = getSortedPostsData()
  const siteUrl = 'https://www.expensesorted.com'
  
  const jsonFeed = {
    version: 'https://jsonfeed.org/version/1.1',
    title: 'Expense Sorted Blog',
    home_page_url: `${siteUrl}/blog`,
    feed_url: `${siteUrl}/feed.json`,
    description: 'Expert personal finance tips, AI-powered expense categorization insights, budgeting strategies, and financial freedom advice.',
    language: 'en-US',
    items: posts.map((post) => ({
      id: `${siteUrl}/blog/${post.slug}`,
      url: `${siteUrl}/blog/${post.slug}`,
      title: post.title,
      content_text: post.summary || '',
      date_published: new Date(post.date).toISOString(),
      date_modified: post.lastModified ? new Date(post.lastModified).toISOString() : new Date(post.date).toISOString(),
      author: post.author ? { name: post.author } : undefined,
      tags: post.keywords ? (Array.isArray(post.keywords) ? post.keywords : post.keywords.split(',').map(k => k.trim())) : [],
    })),
  }

  return new Response(JSON.stringify(jsonFeed, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=86400',
    },
  })
}
