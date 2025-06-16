"use client";
import React from 'react';
import GenericToast from './GenericToast';

const IntegrationsToast: React.FC = () => {
  return (
    <GenericToast
      title="Ready to transform your financial habits?"
      description="Answer a few questions and discover exactly where your money goes."
      ctaText="Free Finance Checkup"
      ctaHref="/personal-finance"
      delay={10000}
      highlightText="financial habits"
    />
  );
};

export default IntegrationsToast;
