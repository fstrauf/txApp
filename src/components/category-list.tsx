import { CategoryBadge } from "./category-badge";
import { Button } from "@/components/ui/button";

type Category = {
  id: string;
  name: string;
};

type CategoryListProps = {
  categories: Category[];
  selectedId?: string;
  onSelect: (categoryId: string) => void;
  className?: string;
};

export function CategoryList({
  categories,
  selectedId,
  onSelect,
  className = "",
}: CategoryListProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="text-sm font-medium mb-1">Categories</div>
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category.id}
            onClick={() => onSelect(category.id)}
            variant="ghost"
            size="sm"
            className={`p-0 h-auto ${selectedId === category.id ? "ring-2 ring-primary" : ""}`}
          >
            <CategoryBadge name={category.name} />
          </Button>
        ))}
      </div>
    </div>
  );
} 