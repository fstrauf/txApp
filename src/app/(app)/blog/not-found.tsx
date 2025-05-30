import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog Post Not Found | Expense Sorted',
  description: 'The blog post you are looking for does not exist.',
  robots: 'noindex, nofollow',
};

export default function BlogNotFound() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl text-center">
      <div className="bg-white p-8 rounded-lg shadow-soft">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Blog Post Not Found</h1>
        <p className="text-xl text-gray-600 mb-8">
          The blog post you're looking for doesn't exist or may have been moved.
        </p>
        
        <div className="space-y-4">
          <Link 
            href="/blog" 
            className="inline-block bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-dark transition-colors"
          >
            Browse All Blog Posts
          </Link>
          
          <div className="text-center">
            <Link 
              href="/" 
              className="text-primary hover:text-primary-dark font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
        
        <div className="mt-12 text-left bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Popular Blog Posts:</h2>
          <ul className="space-y-2">
            <li>
              <Link href="/blog/beyond-llms-sentence-transformers-for-transaction-categorization" className="text-primary hover:underline">
                Beyond LLMs: Advanced Bank Transaction Categorization Methods
              </Link>
            </li>
            <li>
              <Link href="/blog/google-sheets-expense-tracker-template-ultimate-guide" className="text-primary hover:underline">
                The Ultimate Google Sheets Expense Tracker Template
              </Link>
            </li>
            <li>
              <Link href="/blog/emergency-fund-calculator-how-much-do-you-need" className="text-primary hover:underline">
                Emergency Fund Calculator: How Much Do You Really Need?
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
