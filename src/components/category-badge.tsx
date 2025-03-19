import { getCategoryColors } from "@/lib/utils";

type CategoryBadgeProps = {
  name: string;
  className?: string;
};

export function CategoryBadge({ name, className = "" }: CategoryBadgeProps) {
  const colors = getCategoryColors(name);
  
  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text} ${className}`}
    >
      {name}
    </span>
  );
} 