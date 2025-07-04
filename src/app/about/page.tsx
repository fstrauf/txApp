import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Expense Sorted - Personal Finance Made Simple",
  description:
    "Learn about Expense Sorted's mission to simplify personal finance through AI-powered expense categorization. Discover how we help users achieve financial clarity and automate their budgeting.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About Expense Sorted - Personal Finance Made Simple",
    description:
      "Learn about Expense Sorted's mission to simplify personal finance through AI-powered expense categorization. Discover how we help users achieve financial clarity and automate their budgeting.",
    url: "/about",
    siteName: "Expense Sorted",
    type: "website",
    images: [
      {
        url: "/es_og.png",
        alt: "Expense Sorted - Personal Finance Made Simple",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Expense Sorted - Personal Finance Made Simple",
    description:
      "Learn about Expense Sorted's mission to simplify personal finance through AI-powered expense categorization.",
    images: ["/es_og.png"],
  },
};

export default function About() {
  return (
    <div className="min-h-screen bg-background-default">
      <main className="container mx-auto px-4 py-16 max-w-7xl">
        <div className="bg-surface rounded-2xl shadow-soft p-8 space-y-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 text-center bg-clip-text text-transparent bg-linear-to-r from-primary-dark via-primary to-secondary animate-gradient">
            About Expense Sorted
          </h1>
          <div className="max-w-3xl mx-auto space-y-8">
            <p className="text-xl text-gray-700 text-center">
              This is how I do my expenses. I thought the approach was quite good, so I built this page to share it with
              others.
            </p>
            <p className="text-gray-700 text-center">
              I regularly post updates and other content on this topic -{" "}
              <a
                className="text-primary hover:text-primary-dark underline transition-colors"
                href="https://twitter.com/ffstrauf"
                target="_blank"
                rel="noopener noreferrer"
              >
                follow me on Twitter
              </a>{" "}
              or{" "}
              <a
                className="text-primary hover:text-primary-dark underline transition-colors"
                href="https://ffstrauf.substack.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Substack
              </a>
              .
            </p>
            <div className="pt-8">
              <h2 className="text-3xl font-bold text-gray-900 text-center mb-6">Our Mission</h2>
              <p className="text-xl text-gray-700 text-center">
                Most people currently use something like rule-based categorisation. I want to simplify this. I hope that
                by using the{" "}
                <Link
                  href="/fuck-you-money-sheet"
                  className="text-primary hover:text-primary-dark underline transition-colors"
                >
                  Google Sheets™ Template
                </Link>{" "}
                in combination with the categorisation tool you can improve your monthly workflow.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
