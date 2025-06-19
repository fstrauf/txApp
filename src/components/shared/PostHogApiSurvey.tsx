'use client';

import React, { useState, useEffect } from 'react';
import { usePostHog } from 'posthog-js/react';
import { useSession } from 'next-auth/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Box } from '@/components/ui/Box';

// PostHog survey interface (from their API)
export interface PostHogSurvey {
  id: string;
  name: string;
  type: string;
  questions: Array<{
    id: string;
    type: string;
    question: string;
    choices?: string[];
    hasOpenChoice?: boolean;
    buttonText?: string;
  }>;
}

interface PostHogApiSurveyProps {
  surveyId?: string; // ID of survey in PostHog
  surveyName?: string; // Name of survey in PostHog (fallback)
  isVisible: boolean;
  onClose?: () => void;
  onComplete?: (responses: string[]) => void;
  className?: string;
  position?: 'center' | 'bottom-right' | 'top-right';
  variant?: 'modal' | 'inline' | 'toast';
}

const PostHogApiSurvey: React.FC<PostHogApiSurveyProps> = ({
  surveyId,
  surveyName,
  isVisible,
  onClose,
  onComplete,
  className = '',
  position = 'center',
  variant = 'modal'
}) => {
  const posthog = usePostHog();
  const { data: session } = useSession();
  const [survey, setSurvey] = useState<PostHogSurvey | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otherText, setOtherText] = useState('');

  // Fetch survey from PostHog
  useEffect(() => {
    if (!posthog || !isVisible) return;

    const fetchSurvey = () => {
      console.log('🔍 PostHog Debug - Fetching surveys...');
      console.log('PostHog instance:', !!posthog);
      console.log('User distinct ID:', posthog.get_distinct_id());
      console.log('PostHog config:', {
        api_host: posthog.config?.api_host,
        loaded: posthog.has_opted_in_capturing(),
        disabled: posthog.has_opted_out_capturing()
      });
      
      posthog.getActiveMatchingSurveys((surveys) => {
        console.log('🔍 PostHog Survey Debug:');
        console.log('Available surveys:', surveys);
        console.log('Looking for survey ID:', surveyId);
        console.log('Looking for survey name:', surveyName);
        console.log('Survey details:', surveys.map(s => ({ 
          name: s.name, 
          type: s.type, 
          id: s.id,
          questions: s.questions?.length || 0,
          conditions: s.conditions,
          start_date: s.start_date,
          end_date: s.end_date
        })));
        
        // Try to find survey by ID first, then by name
        let targetSurvey;
        if (surveyId) {
          targetSurvey = surveys.find(s => s.id === surveyId && s.type === 'api');
        } else if (surveyName) {
          targetSurvey = surveys.find(s => 
            s.name.toLowerCase() === surveyName.toLowerCase() && s.type === 'api'
          );
        }
        console.log('Target survey found:', targetSurvey);
        
        if (targetSurvey) {
          // Check if already completed using PostHog's storage pattern
          const seenSurvey = localStorage.getItem('seenSurvey_' + targetSurvey.id);
          console.log('Survey already seen:', seenSurvey);
          
          if (seenSurvey) {
            setHasCompleted(true);
            return;
          }

          // Use the survey directly from PostHog (no conversion needed)
          setSurvey(targetSurvey as any);
          
          // Track survey shown (following PostHog tutorial format)
          posthog.capture('survey shown', {
            $survey_id: targetSurvey.id,
            $survey_name: targetSurvey.name
          });
        } else {
          console.log('❌ No matching survey found for:', surveyId ? `ID: ${surveyId}` : `name: ${surveyName}`);
          console.log('Available surveys:', surveys.map(s => ({ name: s.name, id: s.id })));
          
          // Debug: Try to get ALL surveys (not just matching ones)
          console.log('🔧 Debug: Trying to get all surveys...');
          // This is a debug attempt - might not work but worth trying
          if (surveys.length === 0) {
            console.log('🔧 No surveys returned - possible causes:');
            console.log('- Surveys not launched in PostHog dashboard');
            console.log('- User does not match targeting conditions');
            console.log('- PostHog configuration issue');
            console.log('- Network/API issue');
          }
        }
      });
    };

    fetchSurvey();
  }, [posthog, isVisible, surveyId, surveyName]);

  const handleOptionToggle = (value: string) => {
    const question = survey?.questions[0];
    if (!question) return;

    if (question.type === 'single_choice') {
      setSelectedOptions([value]);
    } else {
      setSelectedOptions(prev => 
        prev.includes(value) 
          ? prev.filter(v => v !== value)
          : [...prev, value]
      );
    }
  };

  const handleSubmit = async () => {
    if (!survey || selectedOptions.length === 0) return;

    setIsSubmitting(true);

    try {
      const question = survey.questions[0];
      let finalResponse = selectedOptions[0];
      
      // Handle "Other" option with custom text
      if (question.hasOpenChoice && selectedOptions.includes('Other') && otherText.trim()) {
        finalResponse = otherText.trim();
      }

      // Capture survey response to PostHog (following their tutorial format exactly)
      posthog.capture('survey sent', {
        $survey_id: survey.id,
        $survey_name: survey.name,
        [`$survey_response_${question.id}`]: finalResponse,
        $survey_questions: [
          {
            id: question.id,
            question: question.question,
          }
        ]
      });

      // Store completion using PostHog's pattern
      localStorage.setItem('seenSurvey_' + survey.id, 'true');
      
      setHasCompleted(true);
      onComplete?.(selectedOptions);
      
      // Close after a brief delay
      setTimeout(() => {
        onClose?.();
      }, 1000);

    } catch (error) {
      console.error('Failed to submit survey:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (survey && posthog) {
      posthog.capture('survey dismissed', {
        $survey_id: survey.id,
        $survey_name: survey.name
      });
    }
    onClose?.();
  };

  // Don't render if no survey, completed, or not visible
  if (!isVisible || hasCompleted || !survey) {
    console.log('PostHogApiSurvey not rendering:', { isVisible, hasCompleted, survey: !!survey });
    return null;
  }

  console.log('PostHogApiSurvey rendering with survey:', survey);

  const question = survey.questions[0];
  if (!question) return null;

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-right':
        return 'fixed bottom-4 right-4 z-50';
      case 'top-right':
        return 'fixed top-4 right-4 z-50';
      case 'center':
      default:
        return 'fixed inset-0 z-50 flex items-center justify-center p-4';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'toast':
        return 'max-w-sm shadow-2xl';
      case 'inline':
        return 'w-full max-w-2xl shadow-sm';
      case 'modal':
      default:
        return 'max-w-lg shadow-2xl';
    }
  };

  const content = (
    <div className={`bg-white rounded-xl border border-gray-200 ${getVariantClasses()} ${className}`}>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-1">Quick Question</h3>
            <p className="text-sm text-gray-500">Help us improve your experience</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Question */}
        <div className="mb-8">
          <h4 className="text-lg font-medium text-gray-900 mb-4">{question.question}</h4>
        </div>

        {/* Options */}
        <div className="space-y-3 mb-8">
          {question.choices?.map((choice) => (
            <label
              key={choice}
              className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                selectedOptions.includes(choice)
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <input
                type={question.type === 'single_choice' ? 'radio' : 'checkbox'}
                name={`survey_${survey.id}`}
                value={choice}
                checked={selectedOptions.includes(choice)}
                onChange={() => handleOptionToggle(choice)}
                className="mr-4 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="text-gray-800 font-medium">{choice}</span>
            </label>
          ))}
          
          {/* Other text input if "Other" is selected */}
          {question.hasOpenChoice && selectedOptions.includes('Other') && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl">
              <textarea
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                placeholder="Please tell us more..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none resize-none bg-white"
                rows={3}
              />
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={selectedOptions.length === 0 || isSubmitting}
          className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
              Submitting...
            </div>
          ) : (
            question.buttonText || 'Submit Response'
          )}
        </button>
      </div>
    </div>
  );

  if (variant === 'inline') {
    return content;
  }

  // Modal or toast with backdrop
  return (
    <div className={getPositionClasses()}>
      {position === 'center' && (
        <div 
          className="fixed inset-0 bg-white/60 backdrop-blur-sm" 
          onClick={handleClose} 
        />
      )}
      <div className="relative animate-in fade-in-0 zoom-in-95 duration-200">
        {content}
      </div>
    </div>
  );
};

export default PostHogApiSurvey; 