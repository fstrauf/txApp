"use client";

import React, { useState } from 'react';
import { useEmailSignup } from "@/hooks/useEmailSignup";
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ExportFeedbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onFeedbackSubmitted?: () => void;
}

const exportFormats = [
  {
    id: 'csv',
    name: 'CSV File',
    description: 'Standard spreadsheet format'
  },
  {
    id: 'google-sheets',
    name: 'Google Sheets',
    description: 'Direct integration with Google Sheets'
  },
  {
    id: 'apps',
    name: 'App Integrations',
    description: 'Mint, YNAB, Personal Capital, etc.'
  },
  {
    id: 'other',
    name: 'Other Format',
    description: 'Tell us what you need'
  }
];

export default function ExportFeedbackDialog({ 
  isOpen, 
  onClose, 
  onFeedbackSubmitted 
}: ExportFeedbackDialogProps) {
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [otherFormat, setOtherFormat] = useState('');
  const [additionalComments, setAdditionalComments] = useState('');
  const [step, setStep] = useState<'selection' | 'email'>('selection');

  const { state, actions, userEmail } = useEmailSignup({
    source: 'EXPORT_FEEDBACK',
    tags: ['export_feedback', ...selectedFormats],
    onSuccess: () => {
      setTimeout(() => {
        onFeedbackSubmitted?.();
        onClose();
        // Reset form
        setSelectedFormats([]);
        setOtherFormat('');
        setAdditionalComments('');
        setStep('selection');
      }, 2000);
    }
  });

  const handleFormatToggle = (formatId: string) => {
    setSelectedFormats(prev => 
      prev.includes(formatId) 
        ? prev.filter(id => id !== formatId)
        : [...prev, formatId]
    );
  };

  const handleNext = () => {
    if (selectedFormats.length === 0) {
      return;
    }
    setStep('email');
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare feedback data to include in the email signup
    const feedbackData = {
      selectedFormats,
      otherFormat: selectedFormats.includes('other') ? otherFormat : '',
      additionalComments
    };

    // Store feedback in additional context (you might want to send this to a separate API)
    console.log('Export feedback submitted:', feedbackData);
    
    // Submit email with tags that include the selected formats
    await actions.submitEmail();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Export Coming Soon!
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4">
          {step === 'selection' && (
            <>
              <div className="mb-6">
                <p className="text-gray-600 text-sm">
                  We're working on export functionality! Help us prioritize by telling us what formats you'd find most useful.
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <h4 className="font-medium text-gray-900 text-sm">
                  Which export formats would you prefer? (Select all that apply)
                </h4>
                
                {exportFormats.map((format) => (
                  <div key={format.id}>
                    <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedFormats.includes(format.id)}
                        onChange={() => handleFormatToggle(format.id)}
                        className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <div className="font-medium text-sm text-gray-900">
                          {format.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format.description}
                        </div>
                      </div>
                    </label>
                    
                    {format.id === 'other' && selectedFormats.includes('other') && (
                      <div className="mt-2 ml-6">
                        <input
                          type="text"
                          value={otherFormat}
                          onChange={(e) => setOtherFormat(e.target.value)}
                          placeholder="Please specify the format you need"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Additional comments (optional)
                </label>
                <textarea
                  value={additionalComments}
                  onChange={(e) => setAdditionalComments(e.target.value)}
                  placeholder="Any specific requirements or use cases?"
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleNext}
                  disabled={selectedFormats.length === 0}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  Next
                </button>
              </div>
            </>
          )}

          {step === 'email' && (
            <>
              {state.success ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-green-600 font-medium mb-2">
                    Thanks for your feedback!
                  </p>
                  <p className="text-sm text-gray-600">
                    We'll prioritize the formats you selected and notify you when export is ready.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Get notified when export is ready
                    </h4>
                    <p className="text-sm text-gray-600">
                      We'll email you as soon as your preferred export formats are available.
                    </p>
                  </div>

                  <form onSubmit={handleSubmitFeedback} className="space-y-4">
                    {/* Only show email input if user is not logged in */}
                    {!userEmail && (
                      <div>
                        <input
                          type="email"
                          value={state.email}
                          onChange={(e) => actions.setEmail(e.target.value)}
                          placeholder="your.email@example.com"
                          required
                          disabled={state.isLoading}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm disabled:opacity-50"
                        />
                      </div>
                    )}

                    {/* Show current user's email if logged in */}
                    {userEmail && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-600">
                          We'll notify you at: <span className="font-medium">{userEmail}</span>
                        </p>
                      </div>
                    )}

                    {state.error && (
                      <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
                        {state.error}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setStep('selection')}
                        disabled={state.isLoading}
                        className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-lg transition-colors"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={state.isLoading}
                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors"
                      >
                        {state.isLoading ? 'Submitting...' : 'Submit Feedback'}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
