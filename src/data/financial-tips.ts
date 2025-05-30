import { FinancialTip } from '@/types/financial';

export const sampleTips: FinancialTip[] = [
  {
    id: 'tip1',
    title: 'The 50/30/20 Budget Rule',
    content: 'Allocate 50% of your income to needs (housing, food), 30% to wants (hobbies, dining out), and 20% to savings and debt repayment. This provides a simple framework for managing your money.',
    category: 'Budgeting',
    relatedToCategories: ['Budgeting'],
    tags: ['budgeting', 'rule-of-thumb']
  },
  {
    id: 'tip2',
    title: 'Automate Your Savings',
    content: 'Set up automatic transfers from your checking account to your savings account each payday. Even small, regular contributions add up over time. Treat savings like a non-negotiable bill.',
    category: 'Savings',
    relatedToCategories: ['Savings', 'Investing'],
    tags: ['automation', 'consistency']
  },
  {
    id: 'tip3',
    title: 'Understand Compound Interest',
    content: 'Compound interest is interest earned on your initial deposit plus the accumulated interest. Starting to save or invest early, even with small amounts, can lead to significant growth over the long term.',
    category: 'Investing',
    relatedToCategories: ['Investing', 'Savings'],
    tags: ['compounding', 'long-term']
  },
  {
    id: 'tip4',
    title: 'Review Your Subscriptions Regularly',
    content: 'Many people sign up for subscriptions and forget about them. Take time each quarter to review your recurring payments and cancel any services you no longer use or value.',
    category: 'Budgeting',
    relatedToCategories: ['Budgeting'],
    tags: ['spending', 'review']
  },
  {
    id: 'tip5',
    title: 'Build an Emergency Fund',
    content: 'Aim to save 3-6 months of essential living expenses in an easily accessible account. This fund protects you from unexpected financial shocks like job loss or medical emergencies without derailing your long-term goals.',
    category: 'Savings',
    relatedToCategories: ['Savings'],
    tags: ['emergency', 'security']
  },
  {
    id: 'tip6',
    title: 'Debt Snowball Method',
    content: 'List your debts from smallest to largest balance, regardless of interest rate. Make minimum payments on all debts except the smallest, and put any extra money towards that one. Once it\'s paid off, move to the next smallest. This method can provide strong psychological motivation.',
    category: 'Debt Management',
    relatedToCategories: ['Debt Management'],
    tags: ['debt', 'snowball', 'motivation']
  },
  {
    id: 'tip7',
    title: 'Debt Avalanche Method',
    content: 'List your debts by highest interest rate to lowest. Make minimum payments on all debts except the one with the highest interest rate, and put any extra money towards that one. This method saves you the most money on interest over time.',
    category: 'Debt Management',
    relatedToCategories: ['Debt Management'],
    tags: ['debt', 'avalanche', 'interest-saving']
  }
];
