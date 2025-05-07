import Link from 'next/link';

export default function ApiLandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* New wrapper to constrain all content like the main page */}
      <div className="container mx-auto px-4 max-w-7xl py-8 md:py-16">
        {/* Revised Hero Section - Two Column Layout */}
        <section className="relative py-12 md:py-20 bg-gradient-to-r from-primary to-secondary text-white rounded-xl shadow-lg overflow-hidden">
          {/* Coming Soon Ribbon - Adjusted for Mobile */}
          <div className="absolute top-0 right-0 w-28 h-28 md:w-40 md:h-40 pointer-events-none">
            <div className="absolute transform rotate-45 bg-white text-primary font-semibold text-center py-1 right-[-30px] top-[22px] w-[130px] md:right-[-34px] md:top-[32px] md:w-[170px] shadow-md text-xs md:text-sm">
              Coming Soon
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 px-6 md:px-10">
            {/* Left Column: Text Content */}
            <div className="md:w-1/2 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-bold mb-5 md:mb-6 leading-tight">
                Smarter Transaction Categorization & Enrichment
              </h1>
              <p className="text-lg md:text-xl text-blue-100 mb-6 md:mb-8">
                Coming Soon: Clean merchant names. Personalized categorization. Country-specific context.
                <br />
                All via a lightweight API designed for modern finance apps.
              </p>
              <Link
                href="mailto:f.strauf@gmail.com"
                className="inline-block bg-white text-primary font-semibold py-3 px-8 rounded-lg shadow-md hover:bg-gray-100 transition duration-300 text-lg"
              >
                Contact Us to Discuss Integration
              </Link>
            </div>

            {/* Right Column: Feature Points */}
            <div className="md:w-1/2 space-y-6">
              <div className="p-6 bg-white/10 backdrop-blur-sm rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-2 text-white flex items-center">
                  <span className="mr-3 text-2xl opacity-80">🧽</span> Clean Merchant Names
                </h3>
                <p className="text-blue-50 text-sm">
                  Strip noise and normalize messy transaction strings like "*PAYPAL *NETFLIX-1234."
                </p>
              </div>
              <div className="p-6 bg-white/10 backdrop-blur-sm rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-2 text-white flex items-center">
                  <span className="mr-3 text-2xl opacity-80">🔍</span> Personalized Categorization
                </h3>
                <p className="text-blue-50 text-sm">
                  Use a user's own past behavior to create a custom categorization model—no need for rigid rules.
                </p>
              </div>
              <div className="p-6 bg-white/10 backdrop-blur-sm rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-2 text-white flex items-center">
                  <span className="mr-3 text-2xl opacity-80">🌍</span> Localized Intelligence
                </h3>
                <p className="text-blue-50 text-sm">
                  Understand and categorize based on region-specific spending patterns.
                </p>
              </div>
              {/* Placeholder for future graphic if desired */}
              {/* <div className="mt-6 text-center text-blue-200 text-sm">[Space for a relevant graphic or illustration]</div> */}
            </div>
          </div>
        </section>

        {/* How It Works section */}
        <section className="py-12 md:py-16 bg-gray-50 mt-12 md:mt-16 rounded-xl shadow-lg">
          <div className="px-4">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
              Minimal Setup, Maximum Clarity
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center p-6">
                <div className="bg-primary/10 text-primary rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-2 text-primary">Send Transactions</h3>
                <p className="text-gray-600">
                  POST your raw transaction data to our API.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6">
                <div className="bg-primary/10 text-primary rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-2 text-primary">Optional Training (per user)</h3>
                <p className="text-gray-600">
                  Train a personalized model on each user's historical data for higher accuracy.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6">
                <div className="bg-primary/10 text-primary rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-2 text-primary">Receive Enriched Results</h3>
                <p className="text-gray-600">
                  Get back cleaned merchant names, suggested categories, and confidence scores.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases section */}
        <section className="py-12 md:py-16 bg-white mt-12 md:mt-16 rounded-xl shadow-lg">
          <div className="px-4">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
              Designed for Finance Tools, Spreadsheet Add-ons, and Emerging Fintech
            </h2>
            <div className="max-w-3xl mx-auto">
              <ul className="space-y-6">
                <li className="p-6 border border-gray-200 rounded-lg shadow-sm bg-gray-50">
                  <h3 className="text-xl font-semibold text-primary mb-2">Personal Finance Apps</h3>
                  <p className="text-gray-700">
                    Provide smarter automation without asking users to build rules.
                  </p>
                </li>
                <li className="p-6 border border-gray-200 rounded-lg shadow-sm bg-gray-50">
                  <h3 className="text-xl font-semibold text-primary mb-2">Accounting Software</h3>
                  <p className="text-gray-700">
                    Enrich raw transactions for better reconciliation.
                  </p>
                </li>
                <li className="p-6 border border-gray-200 rounded-lg shadow-sm bg-gray-50">
                  <h3 className="text-xl font-semibold text-primary mb-2">Spreadsheets & Add-ons</h3>
                  <p className="text-gray-700">
                    Add a layer of AI-powered clarity to Google Sheets or Excel workflows.
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-12 md:py-20 bg-primary text-white mt-12 md:mt-16 rounded-xl shadow-lg">
          <div className="text-center px-4">
            <h2 className="text-3xl font-bold mb-6">Let's Talk</h2>
            <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto">
              Looking to integrate categorization into your product? Or just want to explore what's possible?
              Send us a message and we'll get back to you personally.
            </p>
            <Link
              href="mailto:f.strauf@gmail.com"
              className="bg-white text-primary font-semibold py-3 px-8 rounded-lg shadow-md hover:bg-gray-100 transition duration-300 text-lg"
            >
              Contact Us
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
} 