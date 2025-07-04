import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "API Documentation - Expense Categorization API | Expense Sorted",
  description: "Complete API documentation for Expense Sorted's transaction categorization API. Integrate AI-powered expense categorization into your financial applications with our REST API.",
  keywords: "expense categorization API, transaction classification API, financial API documentation, REST API expense sorting, developer API docs",
  alternates: {
    canonical: "/api-docs",
  },
  openGraph: {
    title: "API Documentation - Expense Categorization API | Expense Sorted",
    description: "Complete API documentation for Expense Sorted's transaction categorization API. Integrate AI-powered expense categorization into your financial applications.",
    url: "/api-docs",
    siteName: "Expense Sorted",
    type: "website",
    images: [
      {
        url: "/es_og.png",
        alt: "API Documentation - Expense Categorization API",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "API Documentation - Expense Categorization API | Expense Sorted",
    description: "Complete API documentation for Expense Sorted's transaction categorization API.",
    images: ["/es_og.png"],
  },
};
