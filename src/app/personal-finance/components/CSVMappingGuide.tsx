'use client';

import React from 'react';
import { ExclamationTriangleIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface CSVMappingGuideProps {
  isVisible: boolean;
  onClose: () => void;
}

export const CSVMappingGuide: React.FC<CSVMappingGuideProps> = ({ isVisible, onClose }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-amber-500" />
              <h2 className="text-xl font-bold text-gray-900">CSV Column Mapping Guide</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            {/* Common Mapping Errors */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-red-800 mb-3">Common Mapping Errors</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <XCircleIcon className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-red-700">Amount field contains text</p>
                    <p className="text-red-600 text-sm">Mapping a description column to the "Amount" field</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <XCircleIcon className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-red-700">Description field contains numbers</p>
                    <p className="text-red-600 text-sm">Mapping an amount column to the "Description" field</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <XCircleIcon className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-red-700">Missing required fields</p>
                    <p className="text-red-600 text-sm">Not mapping Date, Amount, or Description columns</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Correct Mapping Examples */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-800 mb-3">Correct Column Mapping</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-3 rounded border">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                      <span className="font-medium text-green-700">Date Field</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Should contain dates like:</p>
                    <ul className="text-xs text-gray-700 space-y-1">
                      <li>• 2024-01-15</li>
                      <li>• 15/01/2024</li>
                      <li>• Jan 15, 2024</li>
                    </ul>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                      <span className="font-medium text-green-700">Amount Field</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Should contain numbers like:</p>
                    <ul className="text-xs text-gray-700 space-y-1">
                      <li>• 25.50</li>
                      <li>• -100.00</li>
                      <li>• 1,234.56</li>
                    </ul>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                      <span className="font-medium text-green-700">Description Field</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Should contain text like:</p>
                    <ul className="text-xs text-gray-700 space-y-1">
                      <li>• UBER EATS SYDNEY</li>
                      <li>• Salary Deposit</li>
                      <li>• Netflix Subscription</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Example CSV Preview */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">Example CSV Structure</h3>
              <div className="bg-white p-3 rounded border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium text-blue-700">Date</th>
                      <th className="text-left p-2 font-medium text-blue-700">Description</th>
                      <th className="text-left p-2 font-medium text-blue-700">Amount</th>
                      <th className="text-left p-2 font-medium text-blue-700">Type</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    <tr className="border-b">
                      <td className="p-2">2024-01-15</td>
                      <td className="p-2">UBER EATS SYDNEY</td>
                      <td className="p-2">-25.50</td>
                      <td className="p-2">Debit</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">2024-01-14</td>
                      <td className="p-2">Salary Deposit</td>
                      <td className="p-2">3500.00</td>
                      <td className="p-2">Credit</td>
                    </tr>
                    <tr>
                      <td className="p-2">2024-01-13</td>
                      <td className="p-2">Netflix Subscription</td>
                      <td className="p-2">-15.99</td>
                      <td className="p-2">Debit</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-3 text-sm text-blue-700">
                <p><strong>Mapping for this CSV:</strong></p>
                <ul className="mt-1 space-y-1">
                  <li>• Date column → <span className="font-mono bg-blue-100 px-1 rounded">Date</span></li>
                  <li>• Description column → <span className="font-mono bg-blue-100 px-1 rounded">Description</span></li>
                  <li>• Amount column → <span className="font-mono bg-blue-100 px-1 rounded">Amount</span></li>
                  <li>• Type column → <span className="font-mono bg-blue-100 px-1 rounded">Direction/Type</span></li>
                </ul>
              </div>
            </div>

            {/* Troubleshooting Steps */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-yellow-800 mb-3">Troubleshooting Steps</h3>
              <ol className="space-y-2 text-sm text-yellow-700 list-decimal list-inside">
                <li>Check that your CSV file has column headers in the first row</li>
                <li>Ensure amount values are numbers, not text (remove currency symbols if present)</li>
                <li>Verify date formats are consistent throughout the file</li>
                <li>Map each required field (Date, Amount, Description) to the correct column</li>
                <li>Use "Don't use" for columns you don't need</li>
                <li>Preview a few rows to confirm the mapping looks correct</li>
              </ol>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Got it, let me fix my mapping
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CSVMappingGuide; 