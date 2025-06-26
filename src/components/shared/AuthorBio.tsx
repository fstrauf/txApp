import React from 'react';
import Link from 'next/link';
import { Box } from '@/components/ui/Box';

interface AuthorBioProps {
  author?: string;
}

const AuthorBio: React.FC<AuthorBioProps> = ({ author = 'Expense Sorted Team' }) => {
  return (
    <Box variant="bordered" padding="md" className="my-8">
      <div className="flex items-start space-x-4">
        <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-xl">ES</span>
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-2">About {author}</h4>
          <p className="text-gray-700 text-sm mb-4 leading-relaxed">
            We're the team behind Expense Sorted, helping thousands of people take control of their finances 
            through AI-powered expense categorization and smart financial insights. After analyzing millions 
            of transactions, we share our learnings to help you make better money decisions.
          </p>
          
          <div className="flex flex-wrap gap-3">
            <Link 
              href="/personal-finance" 
              className="inline-flex items-center text-sm text-primary hover:text-primary-dark font-medium"
            >
              Try our AI categorization
              <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </Link>
            
            <span className="text-gray-300">•</span>
            
            <Link 
              href="/fuck-you-money-sheet" 
              className="inline-flex items-center text-sm text-secondary hover:text-secondary-dark font-medium"
            >
              Calculate your F*** You Money
              <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </Box>
  );
};

export default AuthorBio; 