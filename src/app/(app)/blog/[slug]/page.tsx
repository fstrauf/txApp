import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getPostBySlug, getAllPostSlugs, type BlogPost } from '@/lib/blog-utils';
import { customMDXComponents } from '@/app/mdx-components';
import Link from 'next/link';
import remarkGfm from 'remark-gfm';

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams(): Promise<PageProps['params'][]> {
  const slugs = await getAllPostSlugs();
  return slugs;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata | undefined> {
  const post = await getPostBySlug(params.slug);
  if (!post) {
    return;
  }
  return {
    title: post.title,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      type: 'article',
      publishedTime: post.date,
      // Add more Open Graph metadata as needed (e.g., images, author)
    },
  };
}

export default async function PostPage({ params }: PageProps) {
  const post = await getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="prose prose-quoteless prose-neutral dark:prose-invert max-w-3xl mx-auto py-8">
      {/* <h1 className="text-3xl font-bold mb-2">{post.title}</h1> */}
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        Published on {new Date(post.date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </p>
      <MDXRemote 
        source={post.content} 
        components={customMDXComponents} 
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm],
            // rehypePlugins: [], // Add any rehype plugins here if needed
          }
        }}
      />
      <div className="mt-12 text-center">
        <Link href="/blog" className="text-primary hover:underline">
          &larr; Back to Blog
        </Link>
      </div>
    </article>
  );
} 