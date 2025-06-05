import { getAllPostSlugs, getPostData, PostData } from '@/lib/posts';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import IntegrationsToast from '@/components/shared/IntegrationsToast';
import { Metadata } from 'next';

// This function is needed for Next.js to know which slugs are available at build time
export async function generateStaticParams() {
  const paths = getAllPostSlugs();
  return paths.map(path => ({ slug: path.params.slug }));
}

// This function generates metadata for each blog post page (good for SEO)
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const postData = await getPostData(params.slug);

  if (!postData) {
    return {
      title: 'Post Not Found',
      description: 'The blog post you are looking for does not exist.',
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.expensesorted.com';
  const postUrl = `${siteUrl}/blog/${postData.slug}`;
  const imageUrl = postData.image ? (postData.image.startsWith('http') ? postData.image : `${siteUrl}${postData.image}`) : `${siteUrl}/og-default.jpg`;

  let keywordsArray: string[] = [];
  if (postData.keywords) {
    if (Array.isArray(postData.keywords)) {
      keywordsArray = postData.keywords;
    } else {
      keywordsArray = postData.keywords.split(',').map(k => k.trim());
    }
  }

  const metadata: Metadata = {
    title: `${postData.title} | Expense Sorted Blog`,
    description: postData.summary || 'An article from the Expense Sorted Blog.',
    keywords: keywordsArray.length > 0 ? keywordsArray : undefined,
    authors: postData.author ? [{ name: postData.author }] : [],
    alternates: {
      canonical: postUrl,
    },
    openGraph: {
      title: postData.title,
      description: postData.summary || 'An article from the Expense Sorted Blog.',
      url: postUrl,
      siteName: 'Expense Sorted',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: postData.title,
        },
      ],
      locale: 'en_US',
      type: 'article',
      publishedTime: postData.date,
      authors: postData.author ? [postData.author] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: postData.title,
      description: postData.summary || 'An article from the Expense Sorted Blog.',
      images: [imageUrl],
    },
  };

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl,
    },
    headline: postData.title,
    description: postData.summary,
    image: imageUrl,
    author: {
      '@type': 'Person',
      name: postData.author || 'Expense Sorted Team',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Expense Sorted',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`,
      },
    },
    datePublished: postData.date,
    dateModified: postData.lastModified || postData.date,
  };

  return metadata;
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const postData = await getPostData(params.slug);

  if (!postData) {
    notFound(); // This will render the not-found.js page or a default 404
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.expensesorted.com';
  const postUrl = `${siteUrl}/blog/${postData.slug}`;
  const imageUrl = postData.image ? (postData.image.startsWith('http') ? postData.image : `${siteUrl}${postData.image}`) : `${siteUrl}/og-default.jpg`;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl,
    },
    headline: postData.title,
    description: postData.summary,
    image: imageUrl,
    author: {
      '@type': 'Person',
      name: postData.author || 'Expense Sorted Team',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Expense Sorted',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`,
      },
    },
    datePublished: postData.date,
    dateModified: postData.lastModified || postData.date,
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
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
      <IntegrationsToast />
    </div>
  );
} 