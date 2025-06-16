"use client";
import React, { useState, useEffect } from 'react';

interface MonthlyReminderToastProps {
  delay?: number;
  onClose?: () => void;
  onSetReminder?: () => void; // Callback to open settings tab
  userToastStatus?: string | null; // Pass the user's current toast status
  onStatusUpdate?: (status: 'DISMISSED' | 'SET_REMINDER') => void; // Callback to update parent state
}

const MonthlyReminderToast: React.FC<MonthlyReminderToastProps> = ({ 
  delay = 10000,
  onClose,
  onSetReminder,
  userToastStatus,
  onStatusUpdate
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show the toast if user has already dismissed it or set a reminder
    if (userToastStatus === 'DISMISSED' || userToastStatus === 'SET_REMINDER') {
      return;
    }

    const timer = setTimeout(() => {
      setVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, userToastStatus]);

  const updateToastStatus = async (status: 'DISMISSED' | 'SET_REMINDER') => {
    try {
      await fetch('/api/user/monthly-reminder-toast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      // Update parent state immediately after successful API call
      if (onStatusUpdate) {
        onStatusUpdate(status);
      }
    } catch (error) {
      console.error('Failed to update toast status:', error);
    }
  };

  const handleReminderClick = async () => {
    await updateToastStatus('SET_REMINDER');
    if (onSetReminder) {
      onSetReminder();
    }
    if (onClose) {
      onClose();
    }
  };

  const handleClose = async () => {
    await updateToastStatus('DISMISSED');
    setVisible(false);
    if (onClose) {
      onClose();
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 max-w-sm bg-gradient-to-br from-primary via-primary-dark to-secondary text-white rounded-2xl shadow-2xl border border-white/20 backdrop-blur-md z-50">
      <div className="relative overflow-hidden rounded-2xl">
        {/* Decorative background elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
        <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-secondary/20 rounded-full blur-lg"></div>
        
        <div className="relative p-5">
          {/* Close button positioned absolutely in top-right */}
                     <button
             onClick={handleClose}
             className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-200 hover:scale-110 z-10"
           >
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="text-center px-6">
            <h3 className="font-bold text-xl mb-3 leading-tight">
              Make this a <span className="text-yellow-300">monthly habit</span>?
            </h3>
            <p className="text-sm text-white/90 mb-5 leading-relaxed">
              Regular financial reviews are key to building wealth. Get a monthly reminder to review your finances and upload new transactions.
            </p>
            <button
              onClick={handleReminderClick}
              className="inline-flex items-center justify-center bg-white text-primary px-8 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-center group whitespace-nowrap"
            >
              Set Monthly Reminder
              <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyReminderToast; 