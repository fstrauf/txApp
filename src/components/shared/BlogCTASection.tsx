import React from 'react';
import Link from 'next/link';
import { Box } from '@/components/ui/Box';
import { Calculator, DollarSign, TrendingUp, Target } from 'lucide-react';

interface BlogCTASectionProps {
  postTitle: string;
  postContent?: string;
}

const BlogCTASection: React.FC<BlogCTASectionProps> = ({ postTitle, postContent = '' }) => {
  // Analyze content to determine best CTA
  const getContextualCTA = () => {
    const title = postTitle.toLowerCase();
    const content = postContent.toLowerCase();
    const combined = `${title} ${content}`;
    
    // F*** You Money related
    if (combined.includes('fire') || combined.includes('financial independence') || combined.includes('retire') || combined.includes('freedom')) {
      return {
        type: 'freedom',
        title: 'Calculate Your Financial Freedom',
        description: 'How much money do you need to never worry about work again?',
        cta: 'Calculate My F*** You Money',
        href: '/personal-finance',
        icon: Target,
        color: 'from-primary to-secondary'
      };
    }
    
    // Categorization/budgeting related
    if (combined.includes('categor') || combined.includes('budget') || combined.includes('expense') || combined.includes('spending')) {
      return {
        type: 'categorize',
        title: 'Stop Manual Expense Tracking',
        description: 'Let AI categorize your transactions automatically. See exactly where your money goes.',
        cta: 'Try Free AI Categorization',
        href: '/personal-finance',
        icon: Calculator,
        color: 'from-primary to-secondary'
      };
    }
    
    // Savings/money management related
    if (combined.includes('save') || combined.includes('money') || combined.includes('financial') || combined.includes('personal finance')) {
      return {
        type: 'runway',
        title: 'Calculate Your Personal Runway',
        description: 'How many months could you survive without income? Find out in 2 minutes.',
        cta: 'Calculate My Runway',
        href: '/personal-finance',
        icon: TrendingUp,
        color: 'from-primary to-secondary'
      };
    }
    
    // Default CTA
    return {
      type: 'default',
      title: 'Take Control of Your Finances',
      description: 'Upload your bank statements and get AI-powered insights in minutes.',
      cta: 'Get Started',
      href: '/personal-finance',
      icon: DollarSign,
      color: 'from-primary to-secondary'
    };
  };

  const cta = getContextualCTA();
  const IconComponent = cta.icon;

  return (
    <div className="space-y-8">
      {/* Main CTA Section */}
      <Box variant="gradient" padding="lg" className="my-8">
        <div className="text-center max-w-2xl mx-auto">
          <div className="flex justify-center mb-4">
            <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${cta.color} flex items-center justify-center`}>
              <IconComponent className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            {cta.title}
          </h3>
          
          <p className="text-lg text-gray-700 mb-6">
            {cta.description}
          </p>
          
          <Link
            href={cta.href}
            className={`inline-flex items-center justify-center px-8 py-4 rounded-xl bg-gradient-to-r ${cta.color} text-white font-semibold text-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105`}
          >
            {cta.cta}
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </Link>
          
          <p className="text-sm text-gray-500 mt-3">
            100% free • No credit card required • 2 minute setup
          </p>
        </div>
      </Box>

      {/* Alternative Tools Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        <Box variant="bordered" padding="sm" hoverable className="text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Calculator className="w-6 h-6 text-primary" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Financial Dashboard</h4>
          <p className="text-sm text-gray-600 mb-3">Upload bank statements, get AI insights</p>
          <Link href="/personal-finance" className="text-primary hover:text-primary/80 text-sm font-medium">
            Try Free →
          </Link>
        </Box>

        <Box variant="bordered" padding="sm" hoverable className="text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Target className="w-6 h-6 text-primary" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">F*** You Money</h4>
          <p className="text-sm text-gray-600 mb-3">Calculate financial independence number</p>
          <Link href="/personal-finance" className="text-primary hover:text-primary/80 text-sm font-medium">
            Calculate →
          </Link>
        </Box>

        <Box variant="bordered" padding="sm" hoverable className="text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Google Sheets Add-on</h4>
          <p className="text-sm text-gray-600 mb-3">AI categorization in your spreadsheet</p>
          <Link href="/integrations" className="text-primary hover:text-primary/80 text-sm font-medium">
            Get Add-on →
          </Link>
        </Box>
      </div>
    </div>
  );
};

export default BlogCTASection; 