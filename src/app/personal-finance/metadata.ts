import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Personal Finance Health Check - Get Your 3-Minute Financial Report | Expense Sorted",
  description: "Discover your financial health in just 3 minutes. Get personalized insights on spending, savings, and budget optimization. Free financial assessment with AI-powered recommendations.",
  keywords: "personal finance health check, financial assessment, budget analyzer, spending analysis, savings calculator, financial wellness report",
  alternates: {
    canonical: "/personal-finance",
  },
  openGraph: {
    title: "Personal Finance Health Check - Get Your 3-Minute Financial Report",
    description: "Discover your financial health in just 3 minutes. Get personalized insights on spending, savings, and budget optimization with AI-powered recommendations.",
    url: "/personal-finance",
    siteName: "Expense Sorted",
    type: "website",
    images: [
      {
        url: "/es_og.png",
        alt: "Personal Finance Health Check - 3-Minute Financial Report",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Personal Finance Health Check - Get Your 3-Minute Financial Report",
    description: "Discover your financial health in just 3 minutes with AI-powered recommendations.",
    images: ["/es_og.png"],
  },
};
