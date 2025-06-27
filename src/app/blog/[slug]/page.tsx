import { getAllPostSlugs, getPostData, PostData } from '@/lib/posts';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import BlogCTASection from '@/components/shared/BlogCTASection';
import AuthorBio from '@/components/shared/AuthorBio';
import { Metadata } from 'next';
import { Calculator, Target, TrendingUp } from 'lucide-react';

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

// Fixed Sidebar Component
function BlogSidebar({ postTitle }: { postTitle: string }) {
  const getContextualMessage = () => {
    const title = postTitle.toLowerCase();
    
    if (title.includes('fire') || title.includes('independence') || title.includes('freedom')) {
      return {
        icon: Target,
        title: "Calculate Your Financial Freedom Number",
        description: "See exactly how much you need for financial independence and plan your path to F*** You Money.",
        cta: "Calculate My F*** You Money",
        href: "/personal-finance",
        color: "from-primary to-secondary",
        features: [
          "Calculate your FI number",
          "Track your progress",
          "Plan your timeline"
        ]
      };
    }
    
    if (title.includes('budget') || title.includes('expense') || title.includes('categor')) {
      return {
        icon: Calculator,
        title: "Automate Your Expense Tracking",
        description: "Let AI categorize your transactions automatically and get insights into your spending patterns.",
        cta: "Try Free AI Categorization",
        href: "/personal-finance",
        color: "from-primary to-secondary",
        features: [
          "AI-powered categorization",
          "Smart spending insights",
          "Export to Google Sheets"
        ]
      };
    }
    
    return {
      icon: TrendingUp,
      title: "Analyze Your Financial Health",
      description: "Upload your bank statements and get personalized insights in 2 minutes. No credit card required.",
      cta: "Analyze My Finances Free",
      href: "/personal-finance",
      color: "from-primary to-secondary",
      features: [
        "Instant financial analysis",
        "Personalized recommendations",
        "Track your progress"
      ]
    };
  };

  const message = getContextualMessage();
  const IconComponent = message.icon;

  return (
    <div className="hidden xl:block xl:w-80 xl:pl-8">
      <div className="fixed top-32 w-72">
        <div className="bg-white rounded-lg border border-gray-100 p-5">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className={`w-14 h-14 rounded-full bg-gradient-to-r ${message.color} flex items-center justify-center`}>
                <IconComponent className="w-7 h-7 text-white" />
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">
              {message.title}
            </h3>
            
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              {message.description}
            </p>

            <ul className="text-left space-y-2 mb-6">
              {message.features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            
            <Link
              href={message.href}
              className={`w-full inline-flex items-center justify-center bg-gradient-to-r ${message.color} text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-all duration-200 mb-3`}
            >
              <span className="text-center leading-tight">
                {message.cta}
              </span>
              <svg className="w-4 h-4 ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </Link>
            
            <p className="text-xs text-gray-500">
              100% free • No credit card required • 2 minutes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
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
    <div className="min-h-screen bg-background-default overflow-x-hidden w-full">
      {/* Fixed Sidebar */}
      
      
              {/* Main Content - two column layout */}
        <div className="container mx-auto px-4 py-8 max-w-6xl w-full">
          <script 
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
          />
          
          <div className="flex flex-col xl:flex-row xl:gap-8">
            {/* Content column */}
            <div className="flex-1 xl:max-w-3xl">
          <article className="bg-white p-4 sm:p-6 md:p-8 rounded-lg shadow-soft overflow-hidden">
            <header className="mb-8">
              {/* <h1 className="text-4xl font-bold text-gray-900 mb-3">{postData.title}</h1> */}
              <div className="text-sm text-gray-500">
                <time dateTime={postData.date}>
                  {new Date(postData.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </time>
              </div>
            </header>
            
            {/* Render the HTML content from markdown */}
            <div className="overflow-x-hidden w-full">
              <div 
                className="prose prose-indigo sm:prose-lg max-w-none blog-content"
                style={{
                  width: '100%',
                  maxWidth: '100%',
                  overflowX: 'hidden'
                }}
                dangerouslySetInnerHTML={{ __html: postData.contentHtml || '' }}
              />
            </div>
            
            <script dangerouslySetInnerHTML={{
              __html: `
                document.addEventListener('DOMContentLoaded', function() {
                  const tables = document.querySelectorAll('.blog-content table');
                  tables.forEach(function(table) {
                    if (!table.parentElement.classList.contains('table-wrapper')) {
                      const wrapper = document.createElement('div');
                      wrapper.className = 'table-wrapper';
                      table.parentNode.insertBefore(wrapper, table);
                      wrapper.appendChild(table);
                    }
                  });
                });
              `
            }} />

            {/* Contextual CTA Section - appears after content */}
            <BlogCTASection 
              postTitle={postData.title} 
              postContent={postData.contentHtml || ''} 
            />

            {/* Author Bio */}
            {/* <AuthorBio author={postData.author} /> */}

            <hr className="my-8" />

                         <div className="mt-8">
               <Link href="/blog" className="text-indigo-600 hover:text-indigo-800 font-medium">
                 &larr; Back to all posts
               </Link>
             </div>
           </article>
         </div>
         
         {/* Sidebar column */}
         <BlogSidebar postTitle={postData.title} />
       </div>
     </div>
   </div>
 );
} 