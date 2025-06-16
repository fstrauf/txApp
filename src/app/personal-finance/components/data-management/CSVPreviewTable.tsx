'use client';

import React from 'react';

interface CSVPreviewTableProps {
  headers: string[];
  previewRows: Record<string, any>[];
}

const CSVPreviewTable: React.FC<CSVPreviewTableProps> = ({ headers, previewRows }) => {
  return (
    <div>
      <h5 className="text-md font-medium text-gray-800 mb-3">Preview</h5>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((header, index) => (
                <th key={index} className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewRows.slice(0, 3).map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {headers.map((header, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-3 text-sm text-gray-600 border-b">
                    {String(row[header] || '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CSVPreviewTable; 