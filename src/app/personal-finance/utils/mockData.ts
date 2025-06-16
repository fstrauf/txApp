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

  // Generate transactions for both months
  const months = [
    { month: prevMonth, year: prevYear, maxDay: 28 },
    { month: currentMonth, year: currentYear, maxDay: Math.min(28, currentDate.getDate()) }
  ];

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
      { category: 'Subscriptions', description: 'Adobe Creative Suite', amount: 52.99 }
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

// Static mock data that gets generated once
export const mockTransactions = generateMockTransactions();
export const mockSavingsData = generateMockSavingsData(); 