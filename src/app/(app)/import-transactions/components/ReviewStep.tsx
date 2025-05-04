'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, AlertTriangle } from 'lucide-react';

interface ReviewStepProps {
    validationIssues: { errors: string[], warnings: string[] };
    onBack: () => void; // Function to go back to configuration
    // Add onProceed prop later if we allow proceeding with warnings
}

const ReviewStep: React.FC<ReviewStepProps> = ({
    validationIssues,
    onBack
}) => {
    const hasErrors = validationIssues.errors.length > 0;
    const hasWarnings = validationIssues.warnings.length > 0;

    return (
        <div className="space-y-6">
            <div className="card-style">
                <div className="card-header-style">
                    <h3 className="card-title-style">Review Configuration Issues</h3>
                    <p className="card-description-style">
                        Please fix the following issues before importing.
                    </p>
                </div>
                <div className="p-6 pt-0 space-y-4">
                    {hasErrors && (
                        <div className="alert-error space-y-1">
                            <div className="flex items-center font-medium">
                                <AlertCircle className="h-5 w-5 mr-2" /> Errors:
                            </div>
                            <ul className="list-disc list-inside pl-4 text-sm space-y-1">
                                {validationIssues.errors.map((error, index) => (
                                    <li key={`err-${index}`}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {hasWarnings && (
                        <div className="alert-warning space-y-1">
                             <div className="flex items-center font-medium">
                                <AlertTriangle className="h-5 w-5 mr-2" /> Warnings:
                            </div>
                            <ul className="list-disc list-inside pl-4 text-sm space-y-1">
                                {validationIssues.warnings.map((warning, index) => (
                                    <li key={`warn-${index}`}>{warning}</li>
                                ))}
                            </ul>
                             <p className="text-xs pt-2">Warnings might indicate potential data issues but may not prevent import.</p>
                        </div>
                    )}
                    {!hasErrors && !hasWarnings && (
                        <p className="text-green-700">No configuration issues found.</p> // Should ideally not reach here if validation passes
                    )}
                </div>
            </div>

            {/* --- Buttons --- */}
            <div className="flex space-x-4">
                 <Button
                     type="button"
                     onClick={onBack}
                     className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-indigo-500"
                 >
                     Back to Configuration
                 </Button>
                 {/* Add Proceed button conditionally if needed */}
            </div>
        </div>
    );
};

export default ReviewStep; 