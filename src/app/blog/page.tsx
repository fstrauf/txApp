import Link from 'next/link';
import { getSortedPostsData, PostData } from '@/lib/posts';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Personal Finance Blog - Expert Tips & AI Expense Insights | Expense Sorted',
  description: 'Discover expert personal finance tips, AI-powered expense categorization insights, budgeting strategies, and financial freedom advice from the Expense Sorted team.',
  keywords: 'personal finance blog, expense categorization tips, budgeting advice, AI financial insights, money management, financial freedom, expense tracking',
  alternates: {
    canonical: '/blog',
  },
  openGraph: {
    title: 'Personal Finance Blog - Expert Tips & AI Expense Insights | Expense Sorted',
    description: 'Discover expert personal finance tips, AI-powered expense categorization insights, budgeting strategies, and financial freedom advice.',
    url: '/blog',
    type: 'website',
    siteName: 'Expense Sorted',
    images: [
      {
        url: "/es_og.png",
        alt: "Personal Finance Blog - Expert Tips & AI Expense Insights",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Personal Finance Blog - Expert Tips & AI Expense Insights',
    description: 'Discover expert personal finance tips, AI-powered expense categorization insights, and budgeting strategies.',
    images: ["/es_og.png"],
  },
};

export default function BlogPage() {
  const allPosts = getSortedPostsData();
  console.log('[BlogPage] All Posts Data:', JSON.stringify(allPosts, null, 2));

  if (!allPosts || allPosts.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">Blog</h1>
        <p className="text-gray-700">No blog posts available at the moment. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Blog</h1>
        <div className="flex gap-4">
          <a 
            href="/feed.xml" 
            className="text-primary hover:text-primary-dark text-sm font-medium flex items-center gap-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3.429 2.571c0-.952.771-1.714 1.714-1.714.952 0 1.714.762 1.714 1.714 0 .943-.762 1.714-1.714 1.714-.943 0-1.714-.771-1.714-1.714zm0 5.714c2.286 0 4.571.914 6.286 2.571C11.429 12.571 12.343 14.857 12.343 17.143h3.428c0-9.143-7.428-16.571-16.571-16.571v3.428c3.429 0 6.571 1.4 8.857 3.686S11.714 13.714 11.714 17.143h3.429c0-6.857-5.572-12.429-12.429-12.429V8.286c2.286 0 4.286.914 5.857 2.571S11.429 14.857 11.429 17.143h3.428c0-4.571-3.714-8.286-8.286-8.286V5.714z"/>
            </svg>
            RSS Feed
          </a>
          <a 
            href="/feed.json" 
            className="text-primary hover:text-primary-dark text-sm font-medium"
            target="_blank"
            rel="noopener noreferrer"
          >
            JSON Feed
          </a>
        </div>
      </div>
      <div className="space-y-8">
        {allPosts.map(({ slug, date, title, summary, author }: PostData) => (
          <article key={slug} className="p-6 bg-white rounded-lg shadow-soft hover:shadow-md transition-shadow">
            <header>
              <h2 className="text-2xl font-semibold text-primary hover:text-primary-dark mb-2">
                <Link href={`/blog/${slug}`}>{title}</Link>
              </h2>
              <div className="text-sm text-gray-500 mb-2">
                <time dateTime={date}>{new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
              </div>
            </header>
            {summary && (
              <p className="text-gray-700 mb-4 leading-relaxed">
                {summary}
              </p>
            )}
            <Link href={`/blog/${slug}`} className="text-indigo-600 hover:text-indigo-800 font-medium">
              Read more &rarr;
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
} 