import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Box } from '@/components/ui/Box';

interface FinancialWorkflowStepsProps {
  variant?: 'course' | 'landing';
  className?: string;
}

export function FinancialWorkflowSteps({ 
  variant = 'landing', 
  className = '' 
}: FinancialWorkflowStepsProps) {
  const isCoursePage = variant === 'course';
  
  return (
    <div className={`space-y-8 md:space-y-12 ${className}`}>
      {isCoursePage && (
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Your Step-by-Step Workflow
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Follow these exact steps to transform your financial chaos into a clear, automated system
          </p>
        </div>
      )}
      
      {/* Step 1 - Get Started with Dashboard */}
      <Box variant="lifted" padding="lg">
        <div className="flex items-center mb-4">
          <div className="bg-gradient-to-br from-primary to-secondary text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0">
            1
          </div>
          <h3 className="text-xl font-semibold text-gray-900">
            {isCoursePage ? 'Access Your Dashboard' : 'Get Started with the Dashboard'}
          </h3>
        </div>
        <p className="text-gray-700 mb-6">
          Head over to{' '}
          <Link 
            href="/personal-finance" 
            className="text-primary hover:text-primary-dark underline font-medium"
          >
            the dashboard
          </Link>{' '}
          and click "Manage Data" to get started with your financial analysis.
        </p>
        <div className="max-w-4xl mx-auto">
          <Image
            width={1433}
            height={1207}
            src="/es_financial_overview_dashboard.png"
            className="rounded-lg shadow-lg w-full h-auto"
            alt="Financial overview dashboard"
            quality={100}
          />
        </div>
      </Box>

      {/* Step 2 - Upload Bank Data */}
      <Box variant="lifted" padding="lg">
        <div className="flex items-center mb-4">
          <div className="bg-gradient-to-br from-secondary to-primary text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0">
            2
          </div>
          <h3 className="text-xl font-semibold text-gray-900">
            Upload Your Bank Statements
          </h3>
        </div>
        <p className="text-gray-700 mb-6">
          {isCoursePage 
            ? 'Download CSV files from your bank and upload them through the web app. The system will automatically map your columns and prepare your data for categorization.'
            : 'Upload your bank statements directly through the web app - if you don\'t have a copy of the sheet yet, don\'t worry, we\'ll create a new one with your transactions.'
          }
        </p>
        <div className="max-w-4xl mx-auto">
          <Image
            width={1433}
            height={1207}
            src="/es_bank_import_mapping.png"
            className="rounded-lg shadow-lg w-full h-auto"
            alt="Bank import mapping interface showing CSV upload and column mapping"
            quality={100}
          />
        </div>
      </Box>

      {/* Step 3 - AI Categorization */}
      <Box variant="lifted" padding="lg">
        <div className="flex items-center mb-4">
          <div className="bg-gradient-to-br from-primary to-secondary text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0">
            3
          </div>
          <h3 className="text-xl font-semibold text-gray-900">
            Review AI Categorization
          </h3>
        </div>
        <p className="text-gray-700 mb-6">
          Our AI automatically categorizes your transactions based on merchant names and descriptions. 
          {isCoursePage 
            ? ' Review and adjust any suggestions to match your preferences - this trains the system for better future accuracy.'
            : ' Review and adjust the suggestions to match your preferences. If you have existing data, the categorization will be much more accurate.'
          }
        </p>
        <div className="max-w-4xl mx-auto">
          <Image
            width={1433}
            height={1207}
            src="/es_ex_suggestion_adjustment.png"
            className="rounded-lg shadow-lg w-full h-auto"
            alt="AI categorization interface showing expense suggestions and adjustments"
            quality={100}
          />
        </div>
      </Box>

      {/* Step 4 - Category Selection & Analysis */}
      <Box variant="lifted" padding="lg">
        <div className="flex items-center mb-4">
          <div className="bg-gradient-to-br from-secondary to-primary text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0">
            4
          </div>
          <h3 className="text-xl font-semibold text-gray-900">
            {isCoursePage ? 'Analyze Your Financial Picture' : 'Review Your Data'}
          </h3>
        </div>
        <p className="text-gray-700 mb-6">
          {isCoursePage 
            ? 'Review your categorized transactions and analyze your financial runway, income, expenses by category, and savings rate. This becomes your baseline for improvement.'
            : 'Review your data and get closer to your goals'
          }
        </p>
        <div className="max-w-4xl mx-auto">
          <Image
            width={1433}
            height={1207}
            src="/es_category_selection.png"
            className="rounded-lg shadow-lg w-full h-auto"
            alt="Category selection and financial analysis interface"
            quality={100}
          />
        </div>
      </Box>

      {/* Result/Next Steps */}
      <Box variant="gradient" padding="lg">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            {isCoursePage ? '🎯 Your Financial Baseline' : '✨ The Result'}
          </h3>
          <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
            {isCoursePage 
              ? 'Now you have a clear picture of where your money goes each month. This is your starting point for optimization and building your emergency fund.'
              : 'All your categorized data automatically syncs back to your Google Sheet, giving you the best of both worlds - powerful app features with full data ownership.'
            }
          </p>
          {isCoursePage ? (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 max-w-lg mx-auto">
              <p className="text-sm font-medium text-gray-700">
                <span className="text-primary">Next:</span> Reply to my email with your savings rate and biggest expense category!
              </p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/personal-finance" 
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-br from-primary to-secondary hover:from-primary-dark hover:to-secondary-dark text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Try the App Now
              </Link>
            </div>
          )}
        </div>
      </Box>
    </div>
  );
}

export default FinancialWorkflowSteps; 