import { Metadata } from 'next';
import HomePageClient from './HomePageClient';

export const metadata: Metadata = {
  title: 'ExpenseSorted - Smart Expense Tracking & Financial Health',
  description: 'Transform your financial habits with ExpenseSorted. Smart expense tracking, AI-powered categorization, and insights to improve your financial health.',
  keywords: 'expense tracking, financial health, budget app, personal finance, AI categorization, financial insights',
  openGraph: {
    title: 'ExpenseSorted - Smart Expense Tracking & Financial Health',
    description: 'Transform your financial habits with ExpenseSorted. Smart expense tracking, AI-powered categorization, and insights to improve your financial health.',
    type: 'website',
    url: 'https://www.expensesorted.com',
  },
  alternates: {
    canonical: 'https://www.expensesorted.com',
  },
};

export default function HomePage() {
  return <HomePageClient />;
}