import React from 'react';

// Duplicate Report Component
const DuplicateReport: React.FC<{ report: any; onClose: () => void }> = ({ report, onClose }) => {
    if (!report || !report.duplicates.length) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[80vh] overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Duplicate Transactions Report</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Detection Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Strategy:</span> <span className="font-medium">{report.strategy}</span>
                </div>
                <div>
                  <span className="text-blue-700">Total Uploaded:</span> <span className="font-medium">{report.stats?.total || 0}</span>
                </div>
                <div>
                  <span className="text-blue-700">Unique Transactions:</span> <span className="font-medium text-green-600">{report.stats?.unique || 0}</span>
                </div>
                <div>
                  <span className="text-blue-700">Duplicates Found:</span> <span className="font-medium text-orange-600">{report.duplicateCount}</span>
                </div>
                <div>
                  <span className="text-blue-700">Match Existing Data:</span> <span className="font-medium">{report.stats?.duplicateWithExisting || 0}</span>
                </div>
                <div>
                  <span className="text-blue-700">Duplicates in Upload:</span> <span className="font-medium">{report.stats?.duplicateWithinBatch || 0}</span>
                </div>
              </div>
            </div>

            <h4 className="font-medium text-gray-900 mb-3">Duplicate Transactions ({report.duplicates.length})</h4>
            <div className="space-y-3">
              {report.duplicates.map((dup: any, index: number) => (
                <div key={index} className={`p-3 rounded-lg border ${
                  dup.reason === 'existing' ? 'bg-orange-50 border-orange-200' : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{dup.transaction.description}</div>
                      <div className="text-sm text-gray-600">
                        {dup.transaction.date} • ${Math.abs(dup.transaction.amount).toFixed(2)} • 
                        {dup.transaction.isDebit || dup.transaction.money_in === false ? ' Debit' : ' Credit'}
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      dup.reason === 'existing' 
                        ? 'bg-orange-100 text-orange-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {dup.reason === 'existing' ? 'Matches Existing' : 'Duplicate in Upload'}
                    </div>
                  </div>
                  
                  {dup.existingMatches && dup.existingMatches.length > 0 && (
                    <div className="text-xs text-gray-500">
                      Matches {dup.existingMatches.length} existing transaction(s)
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Detection strategy: <span className="font-medium">{report.strategy}</span> 
                (considers date, amount, direction, and description)
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  export default DuplicateReport; 