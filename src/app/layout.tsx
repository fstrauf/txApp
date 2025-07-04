import "./globals.css";
import "./blog-styles.css";
import { Inter } from "next/font/google";
import Header from "./components/Header.js";
import Footer from "./components/Footer.js";
import { SessionProvider } from "@/app/providers";
import QueryProvider from "@/providers/QueryProvider";
import { ClientSidebarWrapper } from "./components/ClientSidebarWrapper";
import { MobileNavigationProvider } from "@/contexts/MobileNavigationContext";
import type { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.expensesorted.com/"),
  title: "Expense Sorted - Categorise your expenses",
  description:
    "Automatically categorise your monthly expenses using AI. Hook this App up to your Google Sheets™ and get your monthly budgeting done in no time.",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  other: {
    'google-site-verification': process.env.GOOGLE_SITE_VERIFICATION || '',
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

export default async function RootLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex flex-col min-h-screen`} suppressHydrationWarning={true}>
        <SessionProvider>
          <QueryProvider>
            <MobileNavigationProvider>
              <Header />
              <div className="flex flex-1 overflow-x-hidden">
                <ClientSidebarWrapper />
                <main className="grow min-w-0 overflow-x-hidden">{children}</main>
              </div>
              <Footer />
            </MobileNavigationProvider>
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}