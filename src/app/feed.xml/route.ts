import { getSortedPostsData } from '@/lib/posts'

export async function GET() {
  const posts = getSortedPostsData()
  const siteUrl = 'https://www.expensesorted.com'
  
  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Expense Sorted Blog</title>
    <description>Expert personal finance tips, AI-powered expense categorization insights, budgeting strategies, and financial freedom advice.</description>
    <link>${siteUrl}/blog</link>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${posts
      .map(
        (post) => `
    <item>
      <guid>${siteUrl}/blog/${post.slug}</guid>
      <title><![CDATA[${post.title}]]></title>
      <link>${siteUrl}/blog/${post.slug}</link>
      <description><![CDATA[${post.summary || 'Read the full article on Expense Sorted Blog'}]]></description>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      ${post.author ? `<author>noreply@expensesorted.com (${post.author})</author>` : ''}
    </item>`
      )
      .join('')}
  </channel>
</rss>`

  return new Response(rssXml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=86400',
    },
  })
}
