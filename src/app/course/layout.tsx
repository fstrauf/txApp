import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'The 15-Minute Monthly Money System | Personal Finance Course',
  description: 'Transform your finances in 30 days with our proven system. Go from financial chaos to a 6-month runway with just 15 minutes per month.',
  keywords: 'personal finance course, budgeting, financial planning, money management, expense tracking',
  openGraph: {
    title: 'The 15-Minute Monthly Money System',
    description: 'Copy my exact system that took me from financial chaos to a 6-month runway in 18 months.',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function CourseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 