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
        url: '/opengraph-image.png?39779eca9e6e8d74', // Resolved relative to metadataBase
        width: 951,
        height: 635,
        alt: 'Automatically categorise your monthly expenses using AI. Hook this App up to your Google Sheet and get your monthly budgeting done in no time.',
        type: 'image/png',
      },
    ],
  },
};
