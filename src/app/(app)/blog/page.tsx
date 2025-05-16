import Link from 'next/link';
import type { Metadata } from 'next';
import { getAllPosts, type BlogPostMetadata } from '@/lib/blog-utils';

export const metadata: Metadata = {
  title: 'Blog - Expense Sorted',
  description: 'Read the latest articles and insights from the Expense Sorted team.',
};

export default async function BlogIndexPage() {
  const posts = await getAllPosts();

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
          From the Blog
        </h1>
        <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
          Latest articles and insights on personal finance, AI, and productivity.
        </p>
      </header>

      {posts.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400">No posts yet. Check back soon!</p>
      ) : (
        <div className="space-y-12">
          {posts.map((post) => (
            <article key={post.slug} className="relative group">
              <div className="absolute -inset-y-2.5 -inset-x-4 md:-inset-y-4 md:-inset-x-6 sm:rounded-2xl group-hover:bg-gray-50/70 dark:group-hover:bg-gray-800/50 transition-colors duration-200"></div>
              <div className="relative">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                  <Link href={`/blog/${post.slug}`}>
                    <span className="absolute -inset-y-2.5 -inset-x-4 md:-inset-y-4 md:-inset-x-6 sm:rounded-2xl" />
                    {post.title}
                  </Link>
                </h2>
                <p className="mt-3 text-base text-gray-600 dark:text-gray-300 line-clamp-3">
                  {post.summary}
                </p>
                <dl className="mt-4 flex text-sm text-gray-500 dark:text-gray-400">
                  <dt className="sr-only">Published on</dt>
                  <dd>
                    <time dateTime={post.date}>
                      {new Date(post.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </time>
                  </dd>
                  {/* Optionally add reading time or author here */}
                </dl>
                <Link 
                  href={`/blog/${post.slug}`} 
                  className="mt-4 inline-block text-primary hover:underline font-semibold"
                  aria-label={`Read more about ${post.title}`}
                >
                  Read more <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
} 