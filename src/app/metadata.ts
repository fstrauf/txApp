import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Expense Sorted - Categorise your expenses",
  description: "Automatically categorise your monthly expenses using AI. Hook this App up to your Google Sheets™ and get your monthly budgeting done in no time.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: 'website',
    url: '/', // Resolved relative to metadataBase
    title: 'Expense Sorted - Categorise your expenses',
    description: 'Automatically categorise your monthly expenses using AI. Hook this App up to your Google Sheets™ and get your monthly budgeting done in no time.',
    siteName: 'Expense Sorted',
    images: [
      {
        url: '/es_og.png', // Resolved relative to metadataBase
        alt: 'Expense Sorted Financial Overview',
      },
    ],
  },
};
