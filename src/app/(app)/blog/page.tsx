import Link from 'next/link';
import { getSortedPostsData, PostData } from '@/lib/posts';

export const metadata = {
  title: 'Blog | Expense Sorted',
  description: 'Read the latest articles and insights from the Expense Sorted team.',
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
      <h1 className="text-4xl font-bold mb-8 text-gray-900">Blog</h1>
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