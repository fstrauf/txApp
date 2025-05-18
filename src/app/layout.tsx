import "./globals.css";
import "./blog-styles.css";
import { Inter } from "next/font/google";
import Header from "./components/Header.js";
import Footer from "./components/Footer.js";
import { SessionProvider } from "@/app/providers";
import QueryProvider from "@/providers/QueryProvider";
import { ClientSidebarWrapper } from "./components/ClientSidebarWrapper";
import type { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.expensesorted.com/"),
  title: "Expense Sorted - Categorise your expenses",
  description:
    "Automatically categorise your monthly expenses using AI. Hook this App up to your Google Sheets™ and get your monthly budgeting done in no time.",
  alternates: {
    canonical: "/",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Keep server session check if needed elsewhere, but not for Sidebar rendering
  // const session = await getServerSession(authConfig);

  return (
    <html lang="en">
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <SessionProvider>
          <QueryProvider>
            <Header />
            <div className="flex flex-1">
              {/* Render the client wrapper unconditionally */}
              {/* It will handle showing/hiding the Sidebar based on client session */}
              <ClientSidebarWrapper />
              <main className="flex-grow">{children}</main>
            </div>
            <Footer />
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
