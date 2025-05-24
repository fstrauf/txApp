import React from 'react';

export interface InsightCardProps {
  type?: "default" | "warning" | "success" | "optimize";
  icon?: React.ReactNode;
  title: string;
  text: string;
  action?: React.ReactNode;
  benchmark?: React.ReactNode;
  className?: string;
}

export const InsightCard: React.FC<InsightCardProps> = ({ 
  type = "default", 
  icon, 
  title, 
  text, 
  action, 
  benchmark,
  className = "" 
}) => {
  const typeStyles: Record<InsightCardProps['type'] & string, string> = {
    warning: "bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500",
    success: "bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500", 
    optimize: "bg-gradient-to-r from-orange-50 to-yellow-50 border-l-4 border-orange-500",
    default: "bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-500"
  };

  return (
    <div className={`rounded-2xl p-6 mb-5 shadow-sm ${typeStyles[type || 'default']} ${className}`}>
      {icon && <div className="text-3xl mb-4">{icon}</div>}
      <h4 className="text-xl font-bold text-gray-800 mb-3">{title}</h4>
      <p className="text-base text-gray-600 mb-4 leading-relaxed">{text}</p>
      {action && (
        <div className="bg-white bg-opacity-70 rounded-xl p-4 mt-4">
          <div className="text-sm font-semibold text-gray-800">{action}</div>
        </div>
      )}
      {benchmark && (
        <div className="text-xs text-gray-500 italic mt-3">{benchmark}</div>
      )}
    </div>
  );
}; 