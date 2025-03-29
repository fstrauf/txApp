import "./globals.css";
import { Inter } from "next/font/google";
import Header from "./components/Header.js";
import Footer from "./components/Footer.js";
import { SessionProvider } from "@/app/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  metadataBase: new URL("https://www.expensesorted.com/"),
  title: "Expense Sorted - Categorise your expenses",
  description:
    "Automatically categorise your monthly expenses using AI. Hook this App up to your Google Sheets™ and get your monthly budgeting done in no time.",
  alternates: {
    canonical: "/",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <SessionProvider>
          <Header />
          <div className="flex-grow">{children}</div>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
