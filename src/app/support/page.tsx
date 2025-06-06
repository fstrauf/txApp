import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support & Help - Expense Sorted Customer Service",
  description: "Get help with Expense Sorted's AI-powered expense categorization tools. Contact our support team for assistance with Google Sheets add-on, API integration, or account issues.",
  alternates: {
    canonical: "/support",
  },
  openGraph: {
    title: "Support & Help - Expense Sorted Customer Service",
    description: "Get help with Expense Sorted's AI-powered expense categorization tools. Contact our support team for assistance.",
    url: "/support",
    siteName: "Expense Sorted",
    type: "website",
    images: [
      {
        url: "/opengraph-image.png",
        width: 951,
        height: 635,
        alt: "Support & Help - Expense Sorted Customer Service",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Support & Help - Expense Sorted Customer Service",
    description: "Get help with Expense Sorted's AI-powered expense categorization tools.",
    images: ["/opengraph-image.png"],
  },
};

export default function ContactUs() {
  return (
    <>
      <div className="flex justify-center items-center mt-10">
        <p className="mb-4">
          If you need any help,
          please contact us at <a href="mailto:f.strauf@gmail.com" className="underline">here</a>.
        </p>
      </div>
    </>
  );
}
