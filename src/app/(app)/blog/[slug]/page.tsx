import { getAllPostSlugs, getPostData, PostData } from '@/lib/posts';
import Link from 'next/link';
import { notFound } from 'next/navigation';

// This function is needed for Next.js to know which slugs are available at build time
export async function generateStaticParams() {
  const paths = getAllPostSlugs();
  return paths.map(path => ({ slug: path.params.slug }));
}

// This function generates metadata for each blog post page (good for SEO)
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const postData = await getPostData(params.slug);
  if (!postData) {
    return {
      title: 'Post Not Found',
      description: 'The blog post you are looking for does not exist.',
    };
  }
  return {
    title: `${postData.title} | Expense Sorted Blog`,
    description: postData.summary || 'An article from Expense Sorted Blog.',
    openGraph: {
        title: postData.title,
        description: postData.summary,
        type: 'article',
        publishedTime: postData.date,
      },
  };
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const postData = await getPostData(params.slug);

  if (!postData) {
    notFound(); // This will render the not-found.js page or a default 404
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <article className="bg-white p-6 md:p-8 rounded-lg shadow-soft">
        <header className="mb-8">
          {/* <h1 className="text-4xl font-bold text-gray-900 mb-3">{postData.title}</h1> */}
          <div className="text-sm text-gray-500">
            <time dateTime={postData.date}>
              {new Date(postData.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </time>
          </div>
        </header>
        
        {/* Render the HTML content from markdown */}
        <div 
          className="prose prose-indigo lg:prose-lg max-w-none blog-content"
          dangerouslySetInnerHTML={{ __html: postData.contentHtml || '' }}
        />

        <hr className="my-8" />

        <div className="mt-8">
          <Link href="/blog" className="text-indigo-600 hover:text-indigo-800 font-medium">
            &larr; Back to all posts
          </Link>
        </div>
      </article>
    </div>
  );
} 