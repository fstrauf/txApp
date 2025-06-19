'use client';

/**
 * Utility functions for managing survey triggers and state
 */

export const surveyUtils = {
  /**
   * Mark a user as newly registered to trigger post-signup survey
   */
  markUserAsNewlyRegistered: (userEmail: string) => {
    try {
      // Clear any existing "seen" flag so the survey will definitely show
      localStorage.removeItem(`user_seen_${userEmail}`);
      
      // Set a flag indicating this is a new registration
      localStorage.setItem(`user_newly_registered_${userEmail}`, new Date().toISOString());
      
      console.log('User marked as newly registered for survey:', userEmail);
    } catch (error) {
      console.warn('Failed to mark user as newly registered:', error);
    }
  },

  /**
   * Check if user was recently registered and should see post-signup survey
   */
  isNewlyRegisteredUser: (userEmail: string): boolean => {
    try {
      const newlyRegistered = localStorage.getItem(`user_newly_registered_${userEmail}`);
      if (!newlyRegistered) return false;
      
      // Consider "newly registered" for up to 24 hours
      const registrationTime = new Date(newlyRegistered).getTime();
      const now = new Date().getTime();
      const hoursAgo = (now - registrationTime) / (1000 * 60 * 60);
      
      return hoursAgo < 24;
    } catch (error) {
      console.warn('Failed to check newly registered status:', error);
      return false;
    }
  },

  /**
   * Clear the newly registered flag (called after showing survey)
   */
  clearNewlyRegisteredFlag: (userEmail: string) => {
    try {
      localStorage.removeItem(`user_newly_registered_${userEmail}`);
    } catch (error) {
      console.warn('Failed to clear newly registered flag:', error);
    }
  },

  /**
   * Force show post-signup survey (useful for testing or manual triggers)
   */
  forceShowPostSignupSurvey: (userEmail: string) => {
    try {
      localStorage.removeItem(`survey_completed_post_signup_goals_${userEmail}`);
      localStorage.removeItem(`user_seen_${userEmail}`);
      localStorage.setItem(`user_newly_registered_${userEmail}`, new Date().toISOString());
      
      // Reload the page to trigger the survey
      window.location.reload();
    } catch (error) {
      console.warn('Failed to force show post-signup survey:', error);
    }
  },

  /**
   * Reset all survey data for a user (useful for testing)
   */
  resetAllSurveys: (userEmail: string) => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes(userEmail) && (key.includes('survey_') || key.includes('user_seen_') || key.includes('user_newly_registered_'))) {
          localStorage.removeItem(key);
        }
      });
      console.log('All survey data reset for user:', userEmail);
    } catch (error) {
      console.warn('Failed to reset survey data:', error);
    }
  }
};

// Global utility for development/testing
if (typeof window !== 'undefined') {
  (window as any).surveyUtils = surveyUtils;
} 