import { getTransactionTypeColors } from "@/lib/utils";

type TransactionTypeBadgeProps = {
  type: 'income' | 'expense';
  className?: string;
};

export function TransactionTypeBadge({ type, className = "" }: TransactionTypeBadgeProps) {
  const colors = getTransactionTypeColors(type);
  
  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text} ${className}`}
    >
      {type === 'income' ? 'Income' : 'Expense'}
    </span>
  );
} 