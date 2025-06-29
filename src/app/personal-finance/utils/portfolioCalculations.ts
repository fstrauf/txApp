// Centralized portfolio calculation utilities
// This ensures consistent calculations across API and components

export interface Asset {
  quarter: string;
  assetType: string;
  ticker: string;
  holdings: string | number;
  currency: string;
  value: number;
  baseCurrencyValue: number;
  formattedValue: string;
  date: string | number;
  rowIndex: number;
}

export interface AssetAllocation {
  type: string;
  value: number;
  percentage: number;
  count: number;
}

export interface PortfolioData {
  totalValue: number;
  totalAssets: number;
  latestQuarter: string;
  allocation: AssetAllocation[];
  assets: Asset[];
  quarters: string[];
}

/**
 * Calculate portfolio metrics for a specific quarter
 * This is the single source of truth for portfolio calculations
 */
export const calculatePortfolioForQuarter = (
  assets: Asset[], 
  targetQuarter: string
): {
  totalValue: number;
  totalAssets: number;
  allocation: AssetAllocation[];
  quarterAssets: Asset[];
} => {
  // Filter assets for the target quarter
  const quarterAssets = assets.filter(asset => asset.quarter === targetQuarter);
  
  if (quarterAssets.length === 0) {
    return {
      totalValue: 0,
      totalAssets: 0,
      allocation: [],
      quarterAssets: []
    };
  }
  
  // Calculate total value using baseCurrencyValue (the converted value)
  const totalValue = quarterAssets.reduce((sum, asset) => {
    const value = asset.baseCurrencyValue || asset.value || 0;
    return sum + value;
  }, 0);
  
  // Group by asset type for allocation analysis
  const assetTypeGroups = quarterAssets.reduce((acc, asset) => {
    const type = asset.assetType || 'Other';
    if (!acc[type]) {
      acc[type] = { value: 0, count: 0 };
    }
    const value = asset.baseCurrencyValue || asset.value || 0;
    acc[type].value += value;
    acc[type].count += 1;
    return acc;
  }, {} as Record<string, { value: number; count: number }>);
  
  // Calculate allocation percentages
  const allocation: AssetAllocation[] = Object.entries(assetTypeGroups).map(([type, data]) => ({
    type,
    value: data.value,
    percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
    count: data.count
  }));
  
  return {
    totalValue,
    totalAssets: quarterAssets.length,
    allocation,
    quarterAssets
  };
};

/**
 * Calculate complete portfolio data from all assets
 * This handles multiple quarters and determines the latest quarter
 */
export const calculateCompletePortfolioData = (assets: Asset[]): PortfolioData => {
  if (!assets || assets.length === 0) {
    return {
      totalValue: 0,
      totalAssets: 0,
      latestQuarter: '',
      allocation: [],
      assets: [],
      quarters: []
    };
  }
  
  // Get all unique quarters and sort them chronologically
  const quarters = [...new Set(assets.map(a => a.quarter).filter(q => q))].sort((a, b) => {
    // Parse quarter strings like "2024 Q1", "2024 Q2", etc.
    const parseQuarter = (q: string) => {
      const [year, quarter] = q.split(' ');
      const quarterNum = parseInt(quarter.replace('Q', ''));
      return parseInt(year) * 10 + quarterNum;
    };
    return parseQuarter(a) - parseQuarter(b);
  });
  
  // Get the latest quarter
  const latestQuarter = quarters[quarters.length - 1] || '';
  
  // Calculate portfolio data for the latest quarter
  const { totalValue, totalAssets, allocation } = calculatePortfolioForQuarter(assets, latestQuarter);
  
  console.log('🔍 Portfolio calculation debug:', {
    totalAssets: assets.length,
    latestQuarter,
    quarterAssets: assets.filter(a => a.quarter === latestQuarter).length,
    totalValue,
    calculation: 'using baseCurrencyValue for latest quarter only'
  });
  
  return {
    totalValue,
    totalAssets,
    latestQuarter,
    allocation,
    assets,
    quarters
  };
};

/**
 * Format currency consistently across the app
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}; 