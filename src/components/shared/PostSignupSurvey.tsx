'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { surveyUtils } from '@/lib/surveyUtils';
import PostHogApiSurvey from './PostHogApiSurvey';

interface PostSignupSurveyProps {
  className?: string;
}

const PostSignupSurvey: React.FC<PostSignupSurveyProps> = ({ className }) => {
  const { data: session, status } = useSession();
  const [isVisible, setIsVisible] = useState(false);

  // Check if survey should be shown
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.email) return;

    const checkAndShowSurvey = () => {
      // Check if this is a newly registered user or first visit
      const isNewUser = session.user.email ? surveyUtils.isNewlyRegisteredUser(session.user.email) : false;
      const userSeenKey = `user_seen_${session.user.email}`;
      const hasUserBeenSeen = localStorage.getItem(userSeenKey);

      if (isNewUser || !hasUserBeenSeen) {
        const delay = isNewUser ? 2000 : 4000;
        setTimeout(() => {
          setIsVisible(true);
          
          // Mark user as seen if first visit
          if (!hasUserBeenSeen) {
            localStorage.setItem(userSeenKey, new Date().toISOString());
          }
          
          // Clear newly registered flag
          if (isNewUser && session.user.email) {
            surveyUtils.clearNewlyRegisteredFlag(session.user.email);
          }
        }, delay);
      }
    };

    checkAndShowSurvey();
  }, [session?.user?.email, status]);

  return (
    <PostHogApiSurvey
      surveyId="01978a0b-cf67-0000-b478-26f5185cfe1e"
      isVisible={isVisible}
      onClose={() => setIsVisible(false)}
      onComplete={() => setIsVisible(false)}
      position="center"
      variant="modal"
      className={className}
    />
  );
};

export default PostSignupSurvey; 