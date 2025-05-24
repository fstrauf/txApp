import React from 'react';

export interface DiveDeeperCardProps {
  type?: "default" | "spending" | "savings" | "goals";
  icon?: React.ReactNode;
  title: string;
  description: string;
  features?: string[];
  actionText?: string;
  onClick?: () => void;
  className?: string;
}

export const DiveDeeperCard: React.FC<DiveDeeperCardProps> = ({ 
  type = "default", 
  icon, 
  title, 
  description, 
  features = [], 
  actionText,
  onClick,
  className = "" 
}) => {
  const typeStyles: Record<DiveDeeperCardProps['type'] & string, string> = {
    spending: "bg-linear-to-r from-red-50 to-pink-50 hover:border-red-400 hover:shadow-red-100",
    savings: "bg-linear-to-r from-green-50 to-emerald-50 hover:border-green-400 hover:shadow-green-100",
    goals: "bg-linear-to-r from-orange-50 to-yellow-50 hover:border-orange-400 hover:shadow-orange-100",
    default: "bg-linear-to-r from-indigo-50 to-purple-50 hover:border-indigo-400 hover:shadow-indigo-100"
  };

  return (
    <div 
      onClick={onClick}
      className={`${typeStyles[type || 'default']} rounded-2xl p-6 text-center cursor-pointer 
                 transition-all duration-300 border-2 border-transparent shadow-sm
                 hover:transform hover:-translate-y-2 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-opacity-20
                 ${type === 'spending' ? 'focus:ring-red-500' : 
                   type === 'savings' ? 'focus:ring-green-500' : 
                   type === 'goals' ? 'focus:ring-orange-500' : 'focus:ring-indigo-500'} ${className}`}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-gray-800 mb-3">{title}</h3>
      <p className="text-sm text-gray-600 mb-4 leading-relaxed">{description}</p>
      
      {features.length > 0 && (
        <div className="text-left mb-4">
          <ul className="text-xs text-gray-500 space-y-2">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3 shrink-0"></span>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {actionText && (
        <div className="bg-white bg-opacity-80 rounded-xl p-3 mt-4 shadow-sm">
          <div className="text-sm font-semibold text-gray-800">{actionText}</div>
        </div>
      )}
    </div>
  );
}; 