"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";
import Link from 'next/link';

const APIDocsPage = () => {
  
  const EXPENSE_SORTED_API_URL = process.env.NEXT_PUBLIC_EXPENSE_SORTED_API || "http://localhost:5003";
  const specUrl = `${EXPENSE_SORTED_API_URL}/apispec.json`;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/api-landing" className="text-primary hover:text-primary-dark font-semibold text-lg">
                &larr; Back to API Overview
              </Link>
            </div>
            <h1 className="text-2xl font-semibold text-gray-800">
              API Documentation
            </h1>
            <div className="w-1/3"> {/* Spacer to help center title */} </div>
          </div>
        </div>
      </header>
      <main className="py-8">
        <div className="container mx-auto px-1 sm:px-2 lg:px-4 max-w-7xl">
          <div className="bg-white p-2 shadow-xl rounded-lg">
            <SwaggerUI url={specUrl} />
          </div>
        </div>
      </main>
      <footer className="py-8 text-center text-gray-600">
        <p>&copy; {new Date().getFullYear()} Expense Sorted. All rights reserved.</p>
        <p className="mt-1">
          Documentation powered by <a href="https://swagger.io/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Swagger</a>
        </p>
      </footer>
    </div>
  );
};

export default APIDocsPage; 