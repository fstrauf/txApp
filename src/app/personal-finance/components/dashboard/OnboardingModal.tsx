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
import { ModalSigninForm } from './ModalSigninForm';
import { ModalGoogleSignIn } from './ModalGoogleSignIn';
import { useIncrementalAuth } from '@/lib/hooks/useIncrementalAuth';
import posthog from 'posthog-js';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignupComplete: (sheetData?: { spreadsheetId: string; spreadsheetUrl: string }) => void;
  isPaidSnapshot?: boolean;
}

type Step = 'intro' | 'signup' | 'complete';
type AuthMode = 'signup' | 'signin';

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onSignupComplete,
  isPaidSnapshot = false
}) => {
  const [currentStep, setCurrentStep] = useState<Step>('intro');
  const [authMode, setAuthMode] = useState<AuthMode>('signup');
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [createdSheetData, setCreatedSheetData] = useState<{ spreadsheetId: string; spreadsheetUrl: string } | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const { data: session, status } = useSession();
  const { requestSpreadsheetAccess } = useIncrementalAuth();

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      posthog.capture('pf_onboarding_modal_opened', {
        component: 'onboarding_modal'
      });
      setCurrentStep('intro');
      setAuthMode('signup');
      setIsCreatingSheet(false);
      setCreatedSheetData(null);
      setSelectedCurrency('USD'); // Reset to default currency
    }
  }, [isOpen]);

  // Handle automatic progression for existing users
  const handleExistingUserFlow = async () => {
    posthog.capture('pf_onboarding_step_started', {
      step: 'existing_user_flow',
      has_session: !!session?.user
    });
    
    if (session?.user) {
      setCurrentStep('complete');
      createSheetAfterSignup();
    } else {
      setCurrentStep('signup');
    }
  };

  const createSheetAfterSignup = async () => {
    posthog.capture('pf_sheet_creation_started', {
      component: 'onboarding_modal'
    });
    
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
          accessToken,
          baseCurrency: selectedCurrency
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create spreadsheet');
      }

      const data = await response.json();
      
      if (data.success) {
        posthog.capture('pf_sheet_creation_success', {
          component: 'onboarding_modal',
          spreadsheet_id: data.spreadsheetId,
          base_currency: selectedCurrency
        });
        
        // Set sheet data first (this stops the loading state)
        setCreatedSheetData({
          spreadsheetId: data.spreadsheetId,
          spreadsheetUrl: data.spreadsheetUrl
        });
        setIsCreatingSheet(false);
        
        // Open the sheet in a new tab so user can see it
        window.open(data.spreadsheetUrl, '_blank');
        
        // Wait longer to let user see the success state properly before completing onboarding
        setTimeout(() => {
          onSignupComplete(data);
          onClose();
        }, 3000);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error creating sheet:', error);
      posthog.capture('pf_sheet_creation_error', {
        component: 'onboarding_modal',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // On error, complete onboarding without sheet data immediately
      setIsCreatingSheet(false);
      onSignupComplete();
      onClose();
    }
  };

  const handleAuthComplete = () => {
    posthog.capture('pf_onboarding_auth_completed', {
      component: 'onboarding_modal',
      step: 'signup',
      auth_mode: authMode
    });
    setCurrentStep('complete');
    createSheetAfterSignup();
  };

  const handleStartSetup = () => {
    posthog.capture('pf_onboarding_start_setup_clicked', {
      component: 'onboarding_modal',
      step: 'intro'
    });
    handleExistingUserFlow();
  };

  const steps = [
    {
      id: 'get-sheet',
      title: 'Get Your Sheet',
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
        onClick={() => {
          posthog.capture('pf_onboarding_modal_closed', {
            component: 'onboarding_modal',
            step: currentStep,
            method: 'backdrop_click'
          });
          onClose();
        }}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {currentStep === 'intro' && (isPaidSnapshot ? 'Access Your Financial Snapshot' : 'Get Started in 3 Simple Steps')}
            {currentStep === 'signup' && (
              isPaidSnapshot 
                ? (authMode === 'signup' ? 'Create Account to Access Your Snapshot' : 'Sign In to Access Your Snapshot')
                : (authMode === 'signup' ? 'Step 2: Create Your Account' : 'Step 2: Sign In to Your Account')
            )}
            {currentStep === 'complete' && 'All Set! 🎉'}
          </h2>
          <button
            onClick={() => {
              posthog.capture('pf_onboarding_modal_closed', {
                component: 'onboarding_modal',
                step: currentStep,
                method: 'close_button'
              });
              onClose();
            }}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {currentStep === 'intro' && (
            <div className="space-y-6">
              {isPaidSnapshot ? (
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckIcon className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-lg text-gray-900 font-semibold">
                    Payment Successful! 🎉
                  </p>
                  <p className="text-gray-600">
                    Your Financial Snapshot is ready. Create your account to access your personalized analysis.
                  </p>
                </div>
              ) : (
                <p className="text-lg text-gray-600 text-center">
                  Calculate your real financial runway in just 3 minutes
                </p>
              )}
              
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

              {/* Currency Selection */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-3">Select Your Base Currency</h4>
                <p className="text-sm text-blue-700 mb-4">
                  Choose your primary currency. All transactions will be converted to this currency in your new spreadsheet.
                </p>
                
                <div className="max-w-xs">
                  <select
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value)}
                    className="w-full px-3 py-2 border border-blue-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                  >
                    <optgroup label="Major Currencies">
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="JPY">JPY - Japanese Yen</option>
                      <option value="CHF">CHF - Swiss Franc</option>
                      <option value="CAD">CAD - Canadian Dollar</option>
                      <option value="AUD">AUD - Australian Dollar</option>
                      <option value="NZD">NZD - New Zealand Dollar</option>
                    </optgroup>
                    <optgroup label="European Currencies">
                      <option value="SEK">SEK - Swedish Krona</option>
                      <option value="NOK">NOK - Norwegian Krone</option>
                      <option value="DKK">DKK - Danish Krone</option>
                      <option value="PLN">PLN - Polish Złoty</option>
                      <option value="CZK">CZK - Czech Koruna</option>
                    </optgroup>
                    <optgroup label="Other Currencies">
                      <option value="CNY">CNY - Chinese Yuan</option>
                      <option value="INR">INR - Indian Rupee</option>
                      <option value="KRW">KRW - South Korean Won</option>
                      <option value="SGD">SGD - Singapore Dollar</option>
                      <option value="HKD">HKD - Hong Kong Dollar</option>
                    </optgroup>
                    <option value="AUD">AUD - Australian Dollar</option>
                  </select>
                </div>
                
                <div className="mt-3">
                  <p className="text-xs text-blue-600">
                    More currencies available via <a href="https://frankfurter.dev/" target="_blank" rel="noopener noreferrer" className="underline">Frankfurter API</a>
                  </p>
                </div>
              </div>

              <button
                onClick={handleStartSetup}
                className="w-full bg-gradient-to-r from-primary to-secondary text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-primary-dark hover:to-secondary-dark transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                {isPaidSnapshot ? 'Access My Financial Snapshot' : 'Start Setup (3 min)'}
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
                  {authMode === 'signup' ? 'Create Your Account' : 'Sign In to Your Account'}
                </h3>
                <p className="text-gray-600">
                  {isPaidSnapshot 
                    ? (authMode === 'signup' 
                        ? 'Create your account to access your paid Financial Snapshot and start analyzing your data'
                        : 'Sign in to access your paid Financial Snapshot and start analyzing your data'
                      )
                    : (authMode === 'signup'
                        ? 'Sign up to connect your sheet and start analyzing your data'
                        : 'Sign in to connect your sheet and start analyzing your data'
                      )
                  }
                </p>
              </div>

              {/* Auth Toggle */}
              <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
                <button
                  onClick={() => setAuthMode('signup')}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    authMode === 'signup'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Create Account
                </button>
                <button
                  onClick={() => setAuthMode('signin')}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    authMode === 'signin'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Sign In
                </button>
              </div>

              {/* Auth Form */}
              <div className="space-y-4">
                {authMode === 'signup' ? (
                  <ModalSignupForm onSignupSuccess={handleAuthComplete} />
                ) : (
                  <ModalSigninForm onSigninSuccess={handleAuthComplete} />
                )}
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-2 text-gray-500">
                      Or {authMode === 'signup' ? 'sign up' : 'sign in'} with
                    </span>
                  </div>
                </div>
                
                <ModalGoogleSignIn onSignupSuccess={handleAuthComplete} />
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
                      ? 'Your sheet is ready and connected! Opening data upload manager in a moment...'
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
                    Your sheet opened in a new tab. Next, we'll help you upload your bank data.
                  </p>
                </div>
              )}

              {(isCreatingSheet || !createdSheetData) && (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-3 text-gray-600">
                    {isCreatingSheet ? 'Creating sheet...' : 'Opening data manager...'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 