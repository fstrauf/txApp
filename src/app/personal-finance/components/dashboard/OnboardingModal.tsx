import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  DocumentTextIcon, 
  UserPlusIcon, 
  ChartBarIcon,
  CheckIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import { useSession } from 'next-auth/react';
import { ModalSignupForm } from './ModalSignupForm';
import { ModalGoogleSignIn } from './ModalGoogleSignIn';
import { useIncrementalAuth } from '@/lib/hooks/useIncrementalAuth';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignupComplete: (sheetData?: { spreadsheetId: string; spreadsheetUrl: string }) => void;
}

type Step = 'intro' | 'signup' | 'complete';

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onSignupComplete
}) => {
  const [currentStep, setCurrentStep] = useState<Step>('intro');
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [createdSheetData, setCreatedSheetData] = useState<{ spreadsheetId: string; spreadsheetUrl: string } | null>(null);
  const { data: session, status } = useSession();
  const { requestSpreadsheetAccess } = useIncrementalAuth();

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('intro');
      setIsCreatingSheet(false);
      setCreatedSheetData(null);
    }
  }, [isOpen]);

  // Handle automatic progression for existing users
  const handleExistingUserFlow = async () => {
    if (session?.user) {
      setCurrentStep('complete');
      createSheetAfterSignup();
    } else {
      setCurrentStep('signup');
    }
  };

  const createSheetAfterSignup = async () => {
    setIsCreatingSheet(true);
    try {
      // Request Google OAuth permissions for drive access
      const accessToken = await requestSpreadsheetAccess();
      
      // Create the sheet using our API
      const response = await fetch('/api/dashboard/link-spreadsheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          createNew: true,
          accessToken
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create spreadsheet');
      }

      const data = await response.json();
      
      if (data.success) {
        setCreatedSheetData({
          spreadsheetId: data.spreadsheetId,
          spreadsheetUrl: data.spreadsheetUrl
        });
        
        // Open the sheet in a new tab so user can see it
        window.open(data.spreadsheetUrl, '_blank');
        
        // Complete the onboarding with sheet data
        setTimeout(() => {
          onSignupComplete(data);
          onClose();
        }, 2000);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error creating sheet:', error);
      // Fallback - complete without sheet data
      setTimeout(() => {
        onSignupComplete();
        onClose();
      }, 1000);
    } finally {
      setIsCreatingSheet(false);
    }
  };

  const handleSignupComplete = () => {
    setCurrentStep('complete');
    createSheetAfterSignup();
  };

  const handleStartSetup = () => {
    handleExistingUserFlow();
  };

  const steps = [
    {
      id: 'get-sheet',
      title: 'Get Your Free Sheet',
      description: 'We\'ll open a Google Sheets template in a new tab',
      icon: DocumentTextIcon,
      color: 'bg-primary'
    },
    {
      id: 'signup',
      title: 'Sign Me Up',
      description: 'Create your account to connect with your sheet',
      icon: UserPlusIcon,
      color: 'bg-secondary'
    },
    {
      id: 'complete',
      title: 'Start Analyzing',
      description: 'Upload your bank data and see your runway',
      icon: ChartBarIcon,
      color: 'bg-primary'
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blurred Background */}
      <div 
        className="absolute inset-0 backdrop-blur-md transition-all"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {currentStep === 'intro' && 'Get Started in 3 Simple Steps'}
            {currentStep === 'signup' && 'Step 2: Create Your Account'}
            {currentStep === 'complete' && 'All Set! 🎉'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {currentStep === 'intro' && (
            <div className="space-y-6">
              <p className="text-lg text-gray-600 text-center">
                Calculate your real financial runway in just 3 minutes
              </p>
              
              {/* Steps Preview */}
              <div className="space-y-4">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div
                      key={step.id}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg transition-all duration-300 hover:bg-gray-100"
                    >
                      <div className={`w-12 h-12 ${step.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{step.title}</h3>
                        <p className="text-sm text-gray-600">{step.description}</p>
                      </div>
                      <div className="ml-auto">
                        <span className="text-2xl font-bold text-gray-300">{index + 1}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={handleStartSetup}
                className="w-full bg-gradient-to-r from-primary to-secondary text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-primary-dark hover:to-secondary-dark transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Start Setup (3 min)
              </button>
            </div>
          )}

          

          {currentStep === 'signup' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-24 h-24 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserPlusIcon className="h-12 w-12 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Create Your Account
                </h3>
                <p className="text-gray-600">
                  Sign up to connect your sheet and start analyzing your data
                </p>
              </div>

              {/* Signup Form */}
              <div className="space-y-4">
                <ModalSignupForm onSignupSuccess={handleSignupComplete} />
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-2 text-gray-500">Or sign up with</span>
                  </div>
                </div>
                
                <ModalGoogleSignIn onSignupSuccess={handleSignupComplete} />
              </div>
            </div>
          )}

          {currentStep === 'complete' && (
            <div className="text-center space-y-6">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <ChartBarIcon className="h-12 w-12 text-primary" />
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {isCreatingSheet ? 'Creating Your Sheet...' : 'Perfect! You\'re All Set 🎉'}
                </h3>
                <p className="text-gray-600">
                  {isCreatingSheet 
                    ? 'We\'re creating your personal finance tracker in Google Sheets and linking it to your account.'
                    : createdSheetData 
                      ? 'Your account is created and your sheet is ready. Let\'s upload your bank data to see your real financial runway.'
                      : 'Setting up your dashboard...'
                  }
                </p>
              </div>

              {createdSheetData && !isCreatingSheet && (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2 text-secondary">
                    <CheckIcon className="h-6 w-6" />
                    <span className="font-semibold">Sheet created and linked!</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Your sheet has opened in a new tab and is already connected to your account.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-3 text-gray-600">
                  {isCreatingSheet ? 'Creating sheet...' : 'Opening data manager...'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 