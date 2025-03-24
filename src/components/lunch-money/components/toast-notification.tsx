import React from 'react';
import { ToastMessage } from '../types';

type ToastNotificationProps = {
  toastMessage: ToastMessage | null;
};

export default function ToastNotification({ toastMessage }: ToastNotificationProps) {
  if (!toastMessage) return null;
  
  return (
    <div className={`fixed bottom-4 right-4 px-4 py-2 rounded shadow-lg z-50 ${
      toastMessage.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`}>
      {toastMessage.message}
    </div>
  );
} 