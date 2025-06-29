import React from 'react';
import { ChartBarIcon, DocumentPlusIcon } from '@heroicons/react/24/outline';
import { DashboardStats } from '../../utils/dashboardStats';

interface TransactionTabProps {
  transactions: any[];
  isFirstTimeUser: boolean;
}

export const TransactionTab: React.FC<TransactionTabProps> = ({ 
  transactions, 
  isFirstTimeUser 
}) => {
  return (
    <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Transaction Details</h3>
      {transactions.length > 0 ? (
        <div className="space-y-3">
          {transactions.slice(0, 50).map((transaction, index) => (
            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{transaction.category || 'Transaction'}</p>
                <p className="text-sm text-gray-600">{transaction.isDebit ? 'Expense' : 'Income'}</p>
                <p className="text-xs text-gray-500">
                  {transaction.date ? new Date(transaction.date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  }) : 'No date'}
                </p>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${transaction.isDebit ? 'text-red-600' : 'text-green-600'}`}>
                  {transaction.isDebit ? '-' : '+'}${Math.abs(transaction.amount || 0).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
          {transactions.length > 50 && (
            <p className="text-sm text-gray-500 text-center mt-4">
              Showing first 50 of {transactions.length} transactions
            </p>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No transaction data available</p>
          {isFirstTimeUser && (
            <p className="text-sm text-gray-400 mt-2">Connect your data to see transaction details</p>
          )}
        </div>
      )}
    </div>
  );
};

interface AIInsightsTabProps {
  stats: DashboardStats | null;
  isFirstTimeUser: boolean;
  onConnectDataClick: () => void;
}

export const AIInsightsTab: React.FC<AIInsightsTabProps> = ({ 
  stats, 
  isFirstTimeUser, 
  onConnectDataClick 
}) => {
  return (
    <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">🤖 AI-Powered Freedom Insights</h3>
      {stats ? (
        <div className="space-y-6">
          {/* Freedom Analysis */}
          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-2">💰 Your Freedom Burn Rate</h4>
            <p className="text-gray-600 mb-2">
              Here's how much freedom your money is buying you:
            </p>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• <strong>Monthly freedom cost:</strong> ${stats.monthlyAverageExpenses.toLocaleString()} (what it costs to maintain your lifestyle)</li>
              <li>• <strong>Last month's burn:</strong> ${stats.lastMonthExpenses.toLocaleString()} — you {
                stats.lastMonthExpenses < stats.monthlyAverageExpenses 
                  ? '🎉 spent LESS than average (extending your runway!)' 
                  : '⚠️ spent MORE than average (shortening your runway)'
              }</li>
              <li>• <strong>Annual freedom cost:</strong> ${stats.annualExpenseProjection.toLocaleString()} to maintain your current lifestyle</li>
            </ul>
          </div>

          {/* Freedom Building */}
          <div className="border-l-4 border-green-500 pl-4">
            <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-2">🚀 Building Your Freedom Fund</h4>
            <p className="text-gray-600 mb-2">
              Ways to buy yourself more time:
            </p>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• <strong>Current freedom rate:</strong> You're adding ${stats.monthlyAverageSavings.toLocaleString()} to your runway each month</li>
              <li>• <strong>Quick win:</strong> Automate transfers to build your "F*** You Money" faster</li>
              <li>• <strong>Subscription audit:</strong> Cancel unused subscriptions to extend your runway immediately</li>
            </ul>
          </div>

          {/* Freedom Score */}
          <div className="border-l-4 border-purple-500 pl-4">
            <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-2">🎯 Your Freedom Score</h4>
            <p className="text-gray-600 mb-2">
              How close are you to financial independence?
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
              <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-lg font-semibold text-green-600">
                  {Math.round((stats.monthlyAverageSavings / stats.monthlyAverageIncome) * 100)}%
                </p>
                <p className="text-xs text-gray-600">Freedom Rate</p>
                <p className="text-xs text-green-600 mt-1">
                  {Math.round((stats.monthlyAverageSavings / stats.monthlyAverageIncome) * 100) >= 20 ? '🚀 Excellent!' : 
                   Math.round((stats.monthlyAverageSavings / stats.monthlyAverageIncome) * 100) >= 10 ? '👍 Good' : '💪 Keep going!'}
                </p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-lg font-semibold text-blue-600">
                  {Math.round((stats.monthlyAverageExpenses / stats.monthlyAverageIncome) * 100)}%
                </p>
                <p className="text-xs text-gray-600">Lifestyle Cost</p>
                <p className="text-xs text-blue-600 mt-1">
                  {Math.round((stats.monthlyAverageExpenses / stats.monthlyAverageIncome) * 100) <= 50 ? '🎉 Lean living!' : 
                   Math.round((stats.monthlyAverageExpenses / stats.monthlyAverageIncome) * 100) <= 80 ? '👌 Reasonable' : '⚠️ High burn'}
                </p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-lg font-semibold text-purple-600">
                  {stats.runwayMonths ? stats.runwayMonths : Math.round(stats.monthlyAverageSavings > 0 ? (stats.monthlyAverageExpenses / stats.monthlyAverageSavings) : 0)}
                </p>
                <p className="text-xs text-gray-600">Months of Freedom</p>
                <p className="text-xs text-purple-600 mt-1">
                  {(stats.runwayMonths || 0) >= 12 ? '🔥 F*** You Money!' : 
                   (stats.runwayMonths || 0) >= 6 ? '💪 Getting there!' : '🚀 Keep building!'}
                </p>
              </div>
            </div>
          </div>

          {/* Freedom Timeline */}
          <div className="border-l-4 border-orange-500 pl-4">
            <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-2">🗓️ Your Freedom Timeline</h4>
            <p className="text-gray-600 mb-2">
              Here's when you could achieve different levels of freedom:
            </p>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• <strong>Emergency buffer (6 months):</strong> {
                stats.monthlyAverageSavings > 0 
                  ? `${Math.ceil((stats.monthlyAverageExpenses * 6) / stats.monthlyAverageSavings)} months away` 
                  : 'Start saving to calculate'
              } 🛡️</li>
              <li>• <strong>Mini-retirement (12 months):</strong> {
                stats.monthlyAverageSavings > 0 
                  ? `${Math.ceil((stats.monthlyAverageExpenses * 12) / stats.monthlyAverageSavings)} months away` 
                  : 'Start saving to calculate'
              } 🏖️</li>
              <li>• <strong>Your momentum:</strong> {
                stats.lastMonthExpenses < stats.monthlyAverageExpenses 
                  ? '🚀 You\'re accelerating towards freedom!' 
                  : '⚠️ Consider optimizing spending to reach freedom faster'
              }</li>
              <li>• <strong>Pro tip:</strong> Automate investments to compound your way to complete financial independence 💰</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-2">AI Insights Coming Soon</h4>
          <p className="text-gray-500 mb-4">
            Connect your financial data to unlock personalized AI-powered insights and recommendations.
          </p>
          {isFirstTimeUser && (
            <button
              onClick={onConnectDataClick}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
            >
              <DocumentPlusIcon className="h-5 w-5" />
              Connect Data for AI Insights
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Export PortfolioTab from its own file for cleaner organization
export { PortfolioTab } from './PortfolioTab'; 