import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Business Finance Made Simple | Expense Sorted',
  description: 'AI-powered expense tracking for freelancers, sole traders, and small businesses. Automate your business bookkeeping and get tax-ready in minutes. Request beta access now.',
  keywords: [
    'business expense tracking',
    'freelancer accounting',
    'small business finance',
    'AI expense categorization',
    'business bookkeeping software',
    'tax preparation for business',
    'sole trader accounting',
    'business finance automation'
  ],
  openGraph: {
    title: 'Business Finance Made Simple | Expense Sorted',
    description: 'AI-powered expense tracking for freelancers, sole traders, and small businesses. Automate your business bookkeeping and get tax-ready in minutes.',
    type: 'website',
    url: 'https://expensesorted.com/business-finance',
    images: [
      {
        url: '/es_dashboard_close.webp',
        width: 415,
        height: 409,
        alt: 'Business Finance Dashboard'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Business Finance Made Simple | Expense Sorted',
    description: 'AI-powered expense tracking for freelancers, sole traders, and small businesses. Request beta access now.',
    images: ['/es_dashboard_close.webp']
  }
}; 