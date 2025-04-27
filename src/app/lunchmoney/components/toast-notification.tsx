import React from 'react';
import { ToastMessage } from './types';

type ToastNotificationProps = {
  toastMessage: ToastMessage | null;
};

export default function ToastNotification({ toastMessage }: ToastNotificationProps) {
  if (!toastMessage) return null;
  
  return (
    <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-soft z-50 text-white font-medium ${
      toastMessage.type === 'success' ? 'bg-green-600' : 'bg-red-600'
    }`}>
      {toastMessage.message}
    </div>
  );
} 