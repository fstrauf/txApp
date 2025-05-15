import React from "react";
import Link from "next/link";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export default function PageHeader({ title, subtitle, className = "" }: PageHeaderProps) {
  return (
    <div className={`text-center ${className}`}>
      <h1 className="text-4xl md:text-6xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-primary-dark via-primary to-secondary animate-gradient pb-2 leading-normal">
        {title}
      </h1>
      {subtitle && <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-12">{subtitle}</p>}
      <div className="hidden md:flex space-x-4">
        <Link href="/fuck-you-money-sheet" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
          Free Template
        </Link>
        <Link href="/api-landing" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
          Try Our API
        </Link>
        <Link href="/pricing" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
          Pricing
        </Link>
      </div>
      <div className="md:hidden">
        <Link href="/fuck-you-money-sheet" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
          Free Template
        </Link>
        <Link href="/api-landing" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
          Try Our API
        </Link>
        <Link href="/pricing" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
          Pricing
        </Link>
      </div>
    </div>
  );
}
