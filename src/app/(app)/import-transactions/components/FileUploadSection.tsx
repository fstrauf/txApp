'use client';

import React, { ChangeEvent } from 'react';
import { Loader2 } from 'lucide-react';

interface FileUploadSectionProps {
    onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
    isLoading: boolean; // General loading state
    isAnalyzing: boolean; // Specific state for analysis mutation
    fileKey: string; // To help reset the input
}

const FileUploadSection: React.FC<FileUploadSectionProps> = ({
    onFileChange,
    isLoading,
    isAnalyzing,
    fileKey
}) => {
    return (
        <>
            <div className={`card-style ${isAnalyzing ? 'opacity-50' : ''}`}> 
                <div className="card-header-style">
                    <h3 className="card-title-style">Step 1: Upload CSV File</h3>
                    <p className="card-description-style">Select the CSV file containing your bank transactions.</p>
                </div>
                <div className="p-6 pt-0">
                    <input
                        type="file"
                        accept=".csv"
                        onChange={onFileChange}
                        disabled={isLoading || isAnalyzing}
                        className="input-style file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                        key={fileKey} // Use state to reset input if needed
                    />
                </div>
            </div>
            {isAnalyzing && (
                <div className="flex justify-center items-center p-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">Analyzing file...</span>
                </div>
            )}
        </>
    );
};

export default FileUploadSection; 