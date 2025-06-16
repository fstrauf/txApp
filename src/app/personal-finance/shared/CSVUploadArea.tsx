import React from 'react';
import { DocumentTextIcon, LockClosedIcon } from '@heroicons/react/24/outline';

export interface CSVUploadAreaProps {
  onFileSelect: (file: File) => void;
  className?: string;
}

export const CSVUploadArea: React.FC<CSVUploadAreaProps> = ({ 
  onFileSelect, 
  className = "" 
}) => {
  const [isDragOver, setIsDragOver] = React.useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0 && (files[0].type === 'text/csv' || files[0].name.endsWith('.csv'))) {
      onFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className={`text-center my-10 ${className}`}>
      <div 
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-2xl p-12 cursor-pointer transition-all duration-300
                   ${isDragOver 
                     ? 'border-green-500 bg-green-50' 
                     : 'border-indigo-400 bg-indigo-50 hover:border-purple-500 hover:bg-indigo-100'}`}
        onClick={() => document.getElementById('csvFileInput')?.click()}
      >
        <div className={`flex justify-center mb-6 ${isDragOver ? 'text-green-500' : 'text-indigo-500'}`}>
          <DocumentTextIcon className="h-20 w-20" />
        </div>
        <h3 className="text-3xl font-bold text-gray-800 mb-3">Drop your CSV file here</h3>
        <p className="text-lg text-gray-600 mb-6">or click to browse</p>
        <p className="text-sm text-gray-500 mb-8">Supports CSV files from all major NZ banks</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {['ANZ', 'ASB', 'Westpac', 'BNZ'].map((bank) => (
            <div key={bank} className="bg-white rounded-xl p-4 text-sm text-gray-600 border border-gray-200 shadow-sm">
              <div className="font-semibold text-gray-800">{bank}</div>
              <div className="text-xs">Export → CSV</div>
            </div>
          ))}
        </div>
      </div>
      
      <input 
        type="file" 
        id="csvFileInput" 
        accept=".csv" 
        className="hidden" 
        onChange={handleFileInputChange}
      />
      
      <div className="mt-6 p-5 bg-green-50 rounded-xl border-l-4 border-green-500">
        <div className="flex items-center">
          <LockClosedIcon className="h-5 w-5 text-gray-600 mr-3" />
          <div>
            <div className="font-semibold text-gray-800 text-sm">Your data stays private</div>
            <div className="text-xs text-gray-600">All analysis happens in your browser. No data is stored on our servers.</div>
          </div>
        </div>
      </div>
    </div>
  );
}; 