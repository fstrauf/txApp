import React, { useState, useMemo } from 'react';
import { ChartPieIcon, ArrowTrendingUpIcon, BuildingLibraryIcon, CalendarIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { DonutChart } from '@/components/ui/DonutChart';
import { LineChart } from '@/components/ui/LineChart';
import Select from '@/components/ui/Select';

interface AssetAllocation {
  type: string;
  value: number;
  percentage: number;
  count: number;
}

interface AssetsData {
  totalValue: number;
  totalAssets: number;
  latestQuarter: string;
  allocation: AssetAllocation[];
  assets: any[];
  quarters: string[];
}

interface PortfolioTabProps {
  assetsData: AssetsData | null;
  isFirstTimeUser: boolean;
  isLoading: boolean;
  error: string | null;
  onConnectDataClick: () => void;
}

// Mock portfolio data for first-time users
const mockAssetsData: AssetsData = {
  totalValue: 285000,
  totalAssets: 18,
  latestQuarter: '2025 Q1',
  allocation: [
    { type: 'Shares', value: 195000, percentage: 68.4, count: 11 },
    { type: 'Crypto', value: 25000, percentage: 8.8, count: 2 },
    { type: 'Retirement', value: 38000, percentage: 13.3, count: 2 },
    { type: 'Cash', value: 16000, percentage: 5.6, count: 2 },
    { type: 'Cars', value: 11000, percentage: 3.9, count: 1 },
  ],
  assets: [],
  quarters: ['2024 Q4', '2025 Q1']
};

export const PortfolioTab: React.FC<PortfolioTabProps> = ({ 
  assetsData, 
  isFirstTimeUser,
  isLoading,
  error,
  onConnectDataClick 
}) => {
  // Debug logging to see what's happening
  console.log('🔍 PortfolioTab props:', {
    assetsData: assetsData ? 'Data available' : 'No data',
    assetsDataDetail: assetsData,
    isFirstTimeUser,
    isLoading,
    error,
    hasAssetsData: !!assetsData
  });
  
  const rawData = isFirstTimeUser ? mockAssetsData : assetsData;
  
  // State for selected quarter
  const [selectedQuarter, setSelectedQuarter] = useState<string>('');
  
  // Initialize selected quarter to latest when data is available
  React.useEffect(() => {
    if (rawData && rawData.latestQuarter && !selectedQuarter) {
      setSelectedQuarter(rawData.latestQuarter);
    }
  }, [rawData?.latestQuarter, selectedQuarter]);
  
  // Filter and calculate data for selected quarter
  const displayData = useMemo(() => {
    if (!rawData || !selectedQuarter) return rawData;
    
    // Filter assets for the selected quarter
    const quarterAssets = rawData.assets.filter(asset => asset.quarter === selectedQuarter);
    
    if (quarterAssets.length === 0) return rawData;
    
    // Recalculate allocation for this quarter only
    const totalValue = quarterAssets.reduce((sum, asset) => sum + asset.baseCurrencyValue, 0);
    
    // Group by asset type
    const assetTypeAllocation = quarterAssets.reduce((acc, asset) => {
      const type = asset.assetType || 'Other';
      if (!acc[type]) {
        acc[type] = { value: 0, count: 0 };
      }
      acc[type].value += asset.baseCurrencyValue;
      acc[type].count += 1;
      return acc;
    }, {} as Record<string, { value: number; count: number }>);
    
    // Calculate percentages for selected quarter
    const allocation: AssetAllocation[] = Object.entries(assetTypeAllocation).map(([type, allocationData]) => ({
      type,
      value: (allocationData as any).value,
      percentage: ((allocationData as any).value / totalValue) * 100,
      count: (allocationData as any).count
    }));
    
    return {
      ...rawData,
      totalValue,
      totalAssets: quarterAssets.length,
      latestQuarter: selectedQuarter,
      allocation,
      assets: quarterAssets
    };
  }, [rawData, selectedQuarter]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show data if available, even if there are errors
  if (!displayData) {
    // Only show error state if there's an error AND no data available
    if (error && !isFirstTimeUser) {
      return (
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
          <div className="text-center py-8">
            <ChartPieIcon className="h-12 w-12 text-red-400 mx-auto mb-3" />
            <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Portfolio Data Unavailable</h4>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={onConnectDataClick}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
            >
              <BuildingLibraryIcon className="h-5 w-5" />
              Connect Portfolio Data
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
        <div className="text-center py-8">
          <ChartPieIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Portfolio Overview Coming Soon</h4>
          <p className="text-gray-500 mb-4">
            Connect your portfolio data to see investment performance and allocation insights.
          </p>
          {isFirstTimeUser && (
            <button
              onClick={onConnectDataClick}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
            >
              <BuildingLibraryIcon className="h-5 w-5" />
              Connect Portfolio Data
            </button>
          )}
        </div>
      </div>
    );
  }

  // Asset type color mapping for consistency across chart and legend
  const getAssetTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'Shares': 'text-blue-600 bg-blue-50 border-blue-200',
      'Crypto': 'text-orange-600 bg-orange-50 border-orange-200',
      'Retirement': 'text-emerald-600 bg-emerald-50 border-emerald-200',
      'Cash': 'text-cyan-600 bg-cyan-50 border-cyan-200',
      'Cars': 'text-amber-600 bg-amber-50 border-amber-200',
      'Other': 'text-red-600 bg-red-50 border-red-200'
    };
    return colors[type] || colors['Other'];
  };

  // Chart color mapping to match the legend colors
  const getChartColor = (type: string): 'blue' | 'orange' | 'emerald' | 'cyan' | 'amber' | 'red' => {
    const chartColors: Record<string, 'blue' | 'orange' | 'emerald' | 'cyan' | 'amber' | 'red'> = {
      'Shares': 'blue',
      'Crypto': 'orange',
      'Retirement': 'emerald',
      'Cash': 'cyan',
      'Cars': 'amber',
      'Other': 'red'
    };
    return chartColors[type] || chartColors['Other'];
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Prepare historical data for line chart
  const historicalData = useMemo(() => {
    if (!rawData || !rawData.quarters || rawData.quarters.length <= 1) return [];

    // Get all unique asset types
    const allAssetTypes = [...new Set(rawData.assets.map(asset => asset.assetType))];
    
    // Process data for each quarter
    return rawData.quarters.sort().map(quarter => {
      const quarterAssets = rawData.assets.filter(asset => asset.quarter === quarter);
      const totalValue = quarterAssets.reduce((sum, asset) => sum + asset.baseCurrencyValue, 0);
      
      // Calculate allocation percentages for this quarter
      const quarterData: Record<string, any> = { quarter };
      
      allAssetTypes.forEach(assetType => {
        const assetTypeValue = quarterAssets
          .filter(asset => asset.assetType === assetType)
          .reduce((sum, asset) => sum + asset.baseCurrencyValue, 0);
        
        quarterData[assetType] = totalValue > 0 ? (assetTypeValue / totalValue) * 100 : 0;
      });
      
      return quarterData;
    });
  }, [rawData]);

  // Get all asset type categories for the line chart
  const allAssetTypes = useMemo(() => {
    if (!rawData) return [];
    return [...new Set(rawData.assets.map(asset => asset.assetType))];
  }, [rawData]);

  return (
    <div className="space-y-6">
      {/* Error Banner - show if there's an error but data is still available */}
      {error && displayData && !isFirstTimeUser && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm text-yellow-800">
                <strong>Data sync issue:</strong> {error} (showing cached portfolio data)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Overview */}
      <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ChartPieIcon className="h-5 w-5 text-blue-600" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              📊 Portfolio Overview
            </h3>
            {isFirstTimeUser && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                Demo Data
              </span>
            )}
          </div>
          
          {/* Quarter Selector */}
          {rawData && rawData.quarters && rawData.quarters.length > 1 && (
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-gray-500" />
              <div className="min-w-[120px]">
                <Select
                  value={selectedQuarter}
                  onChange={setSelectedQuarter}
                  options={rawData.quarters
                    .sort((a, b) => b.localeCompare(a)) // Sort descending (latest first)
                    .map((quarter) => ({
                      value: quarter,
                      label: quarter
                    }))}
                  size="sm"
                  variant="primary"
                  className="min-w-[120px]"
                />
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(displayData.totalValue)}
            </p>
            <p className="text-sm text-gray-600">Total Portfolio Value</p>
            <p className="text-xs text-blue-600 mt-1">
              {selectedQuarter || displayData.latestQuarter}
              {rawData && rawData.quarters && rawData.quarters.length > 1 && (
                <span className="ml-1 text-gray-400">•</span>
              )}
            </p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
            <p className="text-2xl font-bold text-green-600">{displayData.totalAssets}</p>
            <p className="text-sm text-gray-600">Total Holdings</p>
            <p className="text-xs text-green-600 mt-1">
              {displayData.allocation.length} Asset Types
            </p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
            <p className="text-2xl font-bold text-purple-600">
              {displayData.allocation[0]?.percentage.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-600">Top Allocation</p>
            <p className="text-xs text-purple-600 mt-1">{displayData.allocation[0]?.type}</p>
          </div>
        </div>

        {/* Asset Allocation */}
        <div className="space-y-4">
          <h4 className="text-sm sm:text-base font-medium text-gray-900 flex items-center gap-2">
            <ArrowTrendingUpIcon className="h-4 w-4" />
            Asset Allocation
          </h4>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Donut Chart */}
            <div className="flex items-center justify-center">
              <div className="w-80 h-80">
                <DonutChart
                  data={displayData.allocation.map(allocation => ({
                    category: allocation.type,
                    value: allocation.value,
                    percentage: allocation.percentage
                  }))}
                  category="category"
                  value="value"
                  colors={displayData.allocation.map(allocation => getChartColor(allocation.type)) as ('blue' | 'orange' | 'emerald' | 'cyan' | 'amber' | 'red')[]}
                  variant="donut"
                  valueFormatter={(value) => formatCurrency(value)}
                  showTooltip={true}
                  className="w-full h-full"
                />
              </div>
            </div>

            {/* Asset Type Details */}
            <div className="space-y-3">
              {displayData.allocation
                .sort((a, b) => b.percentage - a.percentage)
                .map((allocation, index) => (
                  <div key={allocation.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                                             <div
                         className={`w-4 h-4 rounded-full ${
                           allocation.type === 'Shares' ? 'bg-blue-500' :
                           allocation.type === 'Crypto' ? 'bg-orange-500' :
                           allocation.type === 'Retirement' ? 'bg-emerald-500' :
                           allocation.type === 'Cash' ? 'bg-cyan-500' :
                           allocation.type === 'Cars' ? 'bg-amber-500' : 'bg-red-500'
                         }`}
                       />
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getAssetTypeColor(allocation.type)}`}>
                        {allocation.type}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(allocation.value)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {allocation.percentage.toFixed(1)}% • {allocation.count} holdings
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Historical Trends - only show if we have multiple quarters */}
        {historicalData.length > 1 && (
          <div className="space-y-4">
            <h4 className="text-sm sm:text-base font-medium text-gray-900 flex items-center gap-2">
              <ChartBarIcon className="h-4 w-4" />
              Asset Allocation Trends
            </h4>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="h-80">
                <LineChart
                  data={historicalData}
                  index="quarter"
                  categories={allAssetTypes}
                  colors={allAssetTypes.map(type => getChartColor(type)) as any}
                  valueFormatter={(value) => `${value.toFixed(1)}%`}
                  showLegend={true}
                  showTooltip={true}
                  showGrid={true}
                  showXAxis={true}
                  showYAxis={true}
                  className="w-full h-full"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Showing allocation percentages over time • Hover over data points for details
              </p>
            </div>
          </div>
        )}

        {/* Portfolio Insights */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-medium text-gray-900 mb-2">💡 Portfolio Insights</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>
                <strong>Diversification:</strong> Your portfolio spans {displayData.allocation.length} asset types
                {displayData.allocation[0]?.percentage > 70 && ' (consider rebalancing if over-concentrated)'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>
                <strong>Growth Focus:</strong> 
                {displayData.allocation.find(a => a.type === 'Shares')?.percentage || 0 > 60 
                  ? ' Strong equity allocation for long-term growth' 
                  : ' Conservative allocation with balanced risk'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>
                <strong>Portfolio Size:</strong> 
                {displayData.totalValue > 500000 
                  ? ' Substantial portfolio - consider tax optimization strategies'
                  : displayData.totalValue > 100000
                    ? ' Growing portfolio - great progress toward financial goals'
                    : ' Building phase - focus on consistent contributions'}
              </span>
            </div>
          </div>
        </div>

        {isFirstTimeUser && (
          <div className="mt-4 text-center">
            <button
              onClick={onConnectDataClick}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
            >
              <BuildingLibraryIcon className="h-5 w-5" />
              Connect Your Real Portfolio Data
            </button>
          </div>
        )}
      </div>
    </div>
  );
}; 