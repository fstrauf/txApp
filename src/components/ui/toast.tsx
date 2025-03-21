"use client"

import React, { createContext, useContext, useState } from 'react';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    // Auto dismiss
    if (toast.duration !== 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration || 5000);
    }
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastViewport />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  const toast = (props: Omit<Toast, 'id'>) => {
    context.addToast(props);
  };

  return {
    toast,
    toasts: context.toasts,
    dismissToast: context.removeToast,
  };
}

const ToastViewport = () => {
  const { toasts, removeToast } = useContext(ToastContext) as ToastContextValue;

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-0 right-0 z-50 flex flex-col gap-2 p-4 md:max-w-[420px]">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto w-full rounded-md border p-4 shadow-lg transition-all ${
            toast.variant === 'destructive'
              ? 'border-red-400 bg-red-100 text-red-900'
              : 'border-gray-200 bg-white text-gray-900'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              {toast.title && <div className="font-medium">{toast.title}</div>}
              {toast.description && <div className="mt-1 text-sm opacity-90">{toast.description}</div>}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-4 inline-flex h-6 w-6 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export const ToastAction: React.FC<{
  altText: string;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}> = ({ altText, onClick, className, children }) => {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-md border bg-transparent px-3 py-1 text-sm font-medium transition-colors hover:bg-gray-100 focus:outline-none ${className || ''}`}
      onClick={onClick}
      aria-label={altText}
    >
      {children}
    </button>
  );
}; 