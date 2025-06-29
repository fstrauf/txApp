// src/app/personal-finance/page.tsx
import React from 'react';
import PersonalFinancePageClient from './PersonalFinancePageClient';

export const metadata = {
  title: 'Personal Finance Dashboard',
  description: 'Manage your personal finances with our dashboard.',
};

const PersonalFinancePage: React.FC = () => {
  return <PersonalFinancePageClient />;
};

export default PersonalFinancePage;