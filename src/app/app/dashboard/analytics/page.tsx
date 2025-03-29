import { Suspense } from 'react';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Financial Analytics Dashboard</h1>
      
      <Suspense fallback={<div>Loading analytics data...</div>}>
        <AnalyticsDashboard />
      </Suspense>
    </div>
  );
} 