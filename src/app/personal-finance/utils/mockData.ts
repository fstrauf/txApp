// Mock transaction data for demo purposes
export interface MockTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  account: string;
  isDebit: boolean;
}

// Mock savings data for runway calculations
export interface MockSavingsData {
  latestNetAssetValue: number;
  latestQuarter: string;
  formattedValue: string;
  totalEntries: number;
  runwayMonths: number;
  monthlyBurnRate: number;
}

// Seed for consistent random numbers
const mockSeed = 12345;
let seedValue = mockSeed;
const seededRandom = () => {
  seedValue = (seedValue * 9301 + 49297) % 233280;
  return seedValue / 233280;
};

// Generate realistic mock transactions for 2 months
export const generateMockTransactions = (): MockTransaction[] => {
  // Reset seed for consistency
  seedValue = mockSeed;
  
  const transactions: MockTransaction[] = [];
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Previous month
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  let transactionId = 1;

  // Generate transactions for last 4 months to get better subscription patterns
  const months = [];
  for (let i = 3; i >= 0; i--) {
    const targetDate = new Date(currentYear, currentMonth - i, 1);
    const month = targetDate.getMonth();
    const year = targetDate.getFullYear();
    const maxDay = i === 0 ? Math.min(28, currentDate.getDate()) : 28;
    months.push({ month, year, maxDay });
  }

  months.forEach(({ month, year, maxDay }) => {
    // Fixed monthly income (salary on 15th, freelance on random day)
    const salaryDate = new Date(year, month, 15);
    transactions.push({
      id: `mock-${transactionId++}`,
      date: salaryDate.toISOString().split('T')[0],
      description: 'Company Payroll - Net Pay',
      amount: 4200, // Fixed salary amount
      category: 'Salary',
      account: 'Checking Account',
      isDebit: false
    });

    // Occasional freelance income
    if (seededRandom() < 0.6) { // 60% chance of freelance income per month
      const freelanceDay = Math.floor(seededRandom() * maxDay) + 1;
      const freelanceDate = new Date(year, month, freelanceDay);
      transactions.push({
        id: `mock-${transactionId++}`,
        date: freelanceDate.toISOString().split('T')[0],
        description: 'Client Project - Web Development',
        amount: Math.round((800 + seededRandom() * 1200) * 100) / 100, // $800-$2000
        category: 'Freelance',
        account: 'Checking Account',
        isDebit: false
      });
    }

    // Fixed monthly bills (first week of month)
    const fixedExpenses = [
      { category: 'Utilities', description: 'PG&E Electric Bill', amount: 125 + seededRandom() * 50 },
      { category: 'Internet', description: 'Comcast Internet', amount: 89.99 },
      { category: 'Phone', description: 'T-Mobile Wireless', amount: 75 },
      { category: 'Insurance', description: 'Auto Insurance Premium', amount: 185 },
      { category: 'Subscriptions', description: 'Netflix Subscription', amount: 15.99 },
      { category: 'Subscriptions', description: 'Spotify Premium', amount: 9.99 },
      { category: 'Subscriptions', description: 'Adobe Creative Suite', amount: 52.99 },
      { category: 'Subscriptions', description: 'GitHub Pro', amount: 4.00 },
      { category: 'Subscriptions', description: 'Gym Membership - FitLife', amount: 29.99 },
      { category: 'Subscriptions', description: 'Cloud Storage - Google One', amount: 2.99 }
    ];

    fixedExpenses.forEach((expense, index) => {
      const day = 2 + index; // Spread bills across first week
      if (day <= maxDay) {
        const date = new Date(year, month, day);
        transactions.push({
          id: `mock-${transactionId++}`,
          date: date.toISOString().split('T')[0],
          description: expense.description,
          amount: Math.round(expense.amount * 100) / 100,
          category: expense.category,
          account: 'Checking Account',
          isDebit: true
        });
      }
    });

    // Variable expenses throughout the month
    const variableExpenses = [
      // Groceries (weekly)
      { category: 'Groceries', descriptions: ['Whole Foods Market', 'Safeway', 'Trader Joes'], frequency: 4, amount: [85, 120] },
      // Restaurants (2-3 times per week)
      { category: 'Restaurants', descriptions: ['Local Bistro', 'Sushi Express', 'Pizza Palace'], frequency: 10, amount: [25, 75] },
      // Gas (bi-weekly)
      { category: 'Gas & Fuel', descriptions: ['Shell Station', 'Chevron'], frequency: 2, amount: [45, 65] },
      // Coffee (frequent)
      { category: 'Coffee', descriptions: ['Starbucks', 'Local Coffee Shop'], frequency: 8, amount: [5, 15] },
      // Transportation
      { category: 'Transportation', descriptions: ['Uber', 'Public Transit'], frequency: 6, amount: [8, 25] },
      // Shopping (occasional)
      { category: 'Shopping', descriptions: ['Amazon Purchase', 'Target'], frequency: 3, amount: [35, 150] },
      // Entertainment (occasional)
      { category: 'Entertainment', descriptions: ['Movie Theater', 'Concert Tickets'], frequency: 2, amount: [15, 45] }
    ];

    variableExpenses.forEach(({ category, descriptions, frequency, amount }) => {
      for (let i = 0; i < frequency; i++) {
        if (seededRandom() < 0.8) { // 80% chance for each variable expense
          const day = Math.floor(seededRandom() * maxDay) + 1;
          const date = new Date(year, month, day);
          const description = descriptions[Math.floor(seededRandom() * descriptions.length)];
          const expenseAmount = amount[0] + seededRandom() * (amount[1] - amount[0]);
          
          transactions.push({
            id: `mock-${transactionId++}`,
            date: date.toISOString().split('T')[0],
            description,
            amount: Math.round(expenseAmount * 100) / 100,
            category,
            account: 'Checking Account',
            isDebit: true
          });
        }
      }
    });

    // Add some higher-value transactions for anomaly detection (1-2 per month)
    const highValueTransactions = [
      { category: 'Shopping', description: 'MacBook Pro Purchase', amount: 2499, chance: 0.05 }, // 5% chance per month
      { category: 'Entertainment', description: 'Concert Tickets - Taylor Swift', amount: 350, chance: 0.15 },
      { category: 'Travel', description: 'Flight to NYC', amount: 485, chance: 0.1 },
      { category: 'Shopping', description: 'Home Appliance - Washer', amount: 1250, chance: 0.08 },
      { category: 'Medical', description: 'Dental Crown Procedure', amount: 1800, chance: 0.05 },
      { category: 'Shopping', description: 'iPhone 15 Pro', amount: 1199, chance: 0.06 },
      { category: 'Entertainment', description: 'Weekend Getaway Resort', amount: 650, chance: 0.12 },
      { category: 'Auto & Transport', description: 'Car Repair - Transmission', amount: 2200, chance: 0.03 }
    ];

    highValueTransactions.forEach(({ category, description, amount, chance }) => {
      if (seededRandom() < chance) {
        const day = Math.floor(seededRandom() * maxDay) + 1;
        const date = new Date(year, month, day);
        
        transactions.push({
          id: `mock-${transactionId++}`,
          date: date.toISOString().split('T')[0],
          description,
          amount,
          category,
          account: 'Checking Account',
          isDebit: true
        });
      }
    });
  });

  // Sort transactions by date (newest first)
  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Generate mock savings data for runway calculation
export const generateMockSavingsData = (): MockSavingsData => {
  // Reset seed for consistency
  seedValue = mockSeed;
  
  // Calculate expected monthly income and expenses using the same logic as transaction generation
  // but without generating the actual transactions to avoid circular dependency
  
  // Expected monthly income:
  // - Fixed salary: $4,200
  // - Freelance (60% chance): average of $800-$2000 = $1,400 * 0.6 = $840
  const expectedMonthlyIncome = 4200 + (1400 * 0.6); // $4,200 + $840 = $5,040
  
  // Expected monthly expenses:
  // Fixed expenses per month
  const monthlyFixedExpenses = 125 + 50*0.5 + 89.99 + 75 + 185 + 15.99 + 9.99 + 52.99; // ~$579 (utilities has random component)
  
  // Variable expenses per month (using average amounts and 80% probability)
  const monthlyVariableExpenses = 
    (102.5 * 4 * 0.8) +    // Groceries: avg $102.5, 4x/month, 80% chance = $328
    (50 * 10 * 0.8) +      // Restaurants: avg $50, 10x/month, 80% chance = $400  
    (55 * 2 * 0.8) +       // Gas: avg $55, 2x/month, 80% chance = $88
    (10 * 8 * 0.8) +       // Coffee: avg $10, 8x/month, 80% chance = $64
    (16.5 * 6 * 0.8) +     // Transportation: avg $16.5, 6x/month, 80% chance = $79.2
    (92.5 * 3 * 0.8) +     // Shopping: avg $92.5, 3x/month, 80% chance = $222
    (30 * 2 * 0.8);        // Entertainment: avg $30, 2x/month, 80% chance = $48
  
  const expectedMonthlyExpenses = monthlyFixedExpenses + monthlyVariableExpenses; // ~$1,808
  const expectedMonthlySavings = expectedMonthlyIncome - expectedMonthlyExpenses; // ~$3,232
  
  // Set realistic net assets based on expected savings rate
  // Assume they've been saving at this rate for 6-8 months
  const monthsOfSavings = 6 + seededRandom() * 2; // 6-8 months
  const targetNetAssets = expectedMonthlySavings * monthsOfSavings;
  
  const currentDate = new Date();
  const currentQuarter = `Q${Math.ceil((currentDate.getMonth() + 1) / 3)} ${currentDate.getFullYear()}`;

  return {
    latestNetAssetValue: Math.round(targetNetAssets),
    latestQuarter: currentQuarter,
    formattedValue: new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(targetNetAssets),
    totalEntries: 8, // Mock number of quarterly entries
    runwayMonths: Math.round(targetNetAssets / expectedMonthlyExpenses), // Use expected expenses for runway
    monthlyBurnRate: Math.round(expectedMonthlyExpenses) // Use expected monthly expenses
  };
};

// Mock financial analytics result for demo purposes
export interface MockFinancialAnalyticsResult {
  user_id: string;
  analysis_period: {
    start_date: string;
    end_date: string;
    total_transactions: number;
  };
  categories_found: {
    all_categories: string[];
    spending_categories: string[];
    income_categories: string[];
    transfer_categories: string[];
  };
  insights: {
    vendor_intelligence: {
      vendors: any[];
      insights: string[];
    };
    anomaly_detection: {
      anomalies: any[];
      insights: string[];
    };
    subscription_analysis: any;
    savings_opportunities: {
      opportunities: any[];
      insights: string[];
    };
    cash_flow_prediction: {
      predictions: any;
      insights: string[];
    };
  };
  processed_at: string;
}

// Generate mock financial analytics data
export const generateMockFinancialAnalytics = (): MockFinancialAnalyticsResult => {
  const currentDate = new Date();
  const fourMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 4, 1);
  
  return {
    user_id: 'demo-user',
    analysis_period: {
      start_date: fourMonthsAgo.toISOString().split('T')[0],
      end_date: currentDate.toISOString().split('T')[0],
      total_transactions: 125
    },
    categories_found: {
      all_categories: ['Restaurants', 'Groceries', 'Coffee', 'Salary', 'Gas & Fuel', 'Transportation', 'Shopping', 'Entertainment', 'Subscriptions', 'Freelance', 'Insurance', 'Phone', 'Internet', 'Utilities', 'Travel', 'Medical', 'Auto & Transport'],
      spending_categories: ['Restaurants', 'Groceries', 'Coffee', 'Gas & Fuel', 'Transportation', 'Shopping', 'Entertainment', 'Subscriptions', 'Insurance', 'Phone', 'Internet', 'Utilities', 'Travel', 'Medical', 'Auto & Transport'],
      income_categories: ['Salary', 'Freelance'],
      transfer_categories: []
    },
    insights: {
      vendor_intelligence: {
        vendors: [
          {
            name: 'Starbucks',
            category: 'Coffee',
            total_spent: 145.50,
            visit_count: 18,
            average_transaction: 8.08,
            first_visit: '2024-01-01',
            last_visit: '2024-02-28',
            visits_per_month: 9
          },
          {
            name: 'Amazon Purchase',
            category: 'Shopping',
            total_spent: 387.25,
            visit_count: 8,
            average_transaction: 48.41,
            first_visit: '2024-01-03',
            last_visit: '2024-02-25',
            visits_per_month: 4
          },
          {
            name: 'Local Bistro',
            category: 'Restaurants',
            total_spent: 325.80,
            visit_count: 12,
            average_transaction: 27.15,
            first_visit: '2024-01-05',
            last_visit: '2024-02-26',
            visits_per_month: 6
          },
          {
            name: 'Whole Foods Market',
            category: 'Groceries',
            total_spent: 580.40,
            visit_count: 10,
            average_transaction: 58.04,
            first_visit: '2024-01-02',
            last_visit: '2024-02-27',
            visits_per_month: 5
          },
          {
            name: 'Shell Station',
            category: 'Gas & Fuel',
            total_spent: 195.60,
            visit_count: 6,
            average_transaction: 32.60,
            first_visit: '2024-01-07',
            last_visit: '2024-02-20',
            visits_per_month: 3
          }
        ],
        insights: [
          'Your top 5 vendors account for $1,634.55 (52%) of total spending',
          'Coffee spending shows highest frequency - potential optimization target',
          'Premium grocery purchases suggest quality preference over cost savings'
        ]
      },
      anomaly_detection: {
        anomalies: [
          {
            amount: 350.00,
            category: 'Entertainment',
            description: 'Concert Tickets - Taylor Swift',
            type: 'amount_spike',
            severity: 'high',
            date: '2024-01-15',
            vendor: 'TicketMaster'
          },
          {
            amount: 1199.00,
            category: 'Shopping',
            description: 'iPhone 15 Pro',
            type: 'amount_spike',
            severity: 'high',
            date: '2024-02-08',
            vendor: 'Apple Store'
          },
          {
            amount: 485.00,
            category: 'Travel',
            description: 'Flight to NYC',
            type: 'amount_spike',
            severity: 'medium',
            date: '2024-01-22',
            vendor: 'Delta Airlines'
          }
        ],
        insights: [
          '3 significant spending anomalies detected in the last 4 months',
          'High-value purchases include electronics ($1,199) and entertainment ($350)',
          'Travel expenses show seasonal patterns with occasional flight purchases',
          'Shopping anomalies suggest planned major purchases rather than impulse buying'
        ]
      },
      subscription_analysis: {
        subscriptions: [
          {
            vendor: 'Netflix Subscription',
            frequency: 1,
            average_amount: 15.99,
            category: 'Subscriptions',
            projected_annual_cost: 191.88,
            monthly_estimate: 15.99,
            total_spent_so_far: 31.98,
            severity: 'low',
            first_transaction: '2024-01-01',
            last_transaction: '2024-02-01',
            date_range_days: 31
          },
          {
            vendor: 'Spotify Premium',
            frequency: 1,
            average_amount: 9.99,
            category: 'Subscriptions',
            projected_annual_cost: 119.88,
            monthly_estimate: 9.99,
            total_spent_so_far: 19.98,
            severity: 'low',
            first_transaction: '2024-01-01',
            last_transaction: '2024-02-01',
            date_range_days: 31
          },
          {
            vendor: 'Adobe Creative Suite',
            frequency: 1,
            average_amount: 52.99,
            category: 'Subscriptions',
            projected_annual_cost: 635.88,
            monthly_estimate: 52.99,
            total_spent_so_far: 105.98,
            severity: 'medium',
            first_transaction: '2024-01-01',
            last_transaction: '2024-02-01',
            date_range_days: 31
          }
        ],
        insights: [
          'You have 3 active subscriptions totaling $78.97/month',
          'Annual subscription cost: $947.64 (18.8% of monthly income)',
          'All subscriptions appear to be regularly used based on payment consistency'
        ],
        summary: {
          total_subscriptions_detected: 3,
          total_projected_annual_cost: 947.64,
          average_monthly_cost: 78.97,
          highest_cost_subscription: 'Adobe Creative Suite',
          highest_annual_cost: 635.88,
          total_spent_so_far: 157.94
        }
      },
      savings_opportunities: {
        opportunities: [
          {
            category: 'Coffee',
            current_spending: 72.75,
            potential_savings: 45.00,
            type: 'category_reduction',
            recommendation: 'Consider making coffee at home 3 days per week. At $8 per coffee shop visit vs $1.50 for home-made coffee, you could save $45/month.'
          },
          {
            category: 'Restaurants',
            current_spending: 162.90,
            potential_savings: 65.00,
            type: 'category_reduction',
            recommendation: 'Replace 4 restaurant meals per month with home cooking. Average restaurant meal $27 vs $8 home-cooked meal = $76 savings potential.'
          },
          {
            category: 'Shopping',
            current_spending: 193.63,
            potential_savings: 58.00,
            type: 'category_reduction',
            recommendation: 'Wait 24 hours before making purchases over $50. This reduces impulse buying by ~30% according to behavioral studies.'
          },
          {
            category: 'Subscriptions',
            current_spending: 78.97,
            potential_savings: 15.99,
            type: 'vendor_consolidation',
            recommendation: 'Cancel Netflix if you primarily use other streaming services. Consider sharing family plans with trusted contacts.',
            vendors: ['Netflix Subscription']
          }
        ],
        insights: [
          'Total potential monthly savings: $183.99',
          'Highest impact: Reducing coffee shop visits (easy difficulty, high confidence)',
          'Quick wins: Review subscriptions and implement purchase waiting periods',
          'Annual potential savings: $2,207.88 (43.8% of current expenses)'
        ]
      },
      cash_flow_prediction: {
        predictions: {
          weekly_spending_estimate: 712.5,
          weekly_income_estimate: 1260,
          weekly_net: 547.5,
          monthly_net_estimate: 2190
        },
        insights: [
          'Projected savings rate for next month: 43.5% (excellent)',
          'Income appears stable with consistent salary and freelance work',
          'Spending patterns show good consistency and predictability',
          'No concerning seasonal spending spikes detected'
        ]
      }
    },
    processed_at: new Date().toISOString()
  };
};

// Static mock data that gets generated once
export const mockTransactions = generateMockTransactions();
export const mockSavingsData = generateMockSavingsData();
export const mockFinancialAnalytics = generateMockFinancialAnalytics(); 