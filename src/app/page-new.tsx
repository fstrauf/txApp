import { Metadata } from 'next';
import HomePageClient from './HomePageClient';

export const metadata: Metadata = {
  title: 'ExpenseSorted - Smart Expense Tracking for New Zealand',
  description: 'Transform your financial life with AI-powered categorization, intelligent insights, and seamless bank integration. Built for New Zealanders who want to take control of their money.',
  alternates: {
    canonical: '/'
  },
  openGraph: {
    title: 'ExpenseSorted - Smart Expense Tracking for New Zealand',
    description: 'Transform your financial life with AI-powered categorization, intelligent insights, and seamless bank integration. Built for New Zealanders who want to take control of their money.',
    url: 'https://www.expensesorted.com',
    siteName: 'ExpenseSorted',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_NZ',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ExpenseSorted - Smart Expense Tracking for New Zealand',
    description: 'Transform your financial life with AI-powered categorization, intelligent insights, and seamless bank integration. Built for New Zealanders who want to take control of their money.',
    images: ['/og-image.jpg'],
  },
};

export default function HomePage() {
  return <HomePageClient />;
}
