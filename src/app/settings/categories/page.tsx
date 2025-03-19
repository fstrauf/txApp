"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategoryBadge } from "@/components/category-badge";
import { toast } from "react-hot-toast";

type Category = {
  id: string;
  name: string;
  isDefault: boolean;
};

export default function CategoriesPage() {
  const { data: session, status } = useSession();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newCategory, setNewCategory] = useState({ name: "" });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/categories");
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        } else {
          toast.error("Failed to load categories");
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("An error occurred while loading categories");
      } finally {
        setIsLoading(false);
      }
    }

    if (session) {
      fetchCategories();
    }
  }, [session]);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCategory.name.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newCategory),
      });
      
      if (response.ok) {
        const data = await response.json();
        setCategories([...categories, data]);
        setNewCategory({ name: "" });
        toast.success("Category created successfully");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to create category");
      }
    } catch (error) {
      console.error("Error creating category:", error);
      toast.error("An error occurred while creating the category");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingCategory || !editingCategory.name.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/categories/${editingCategory.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editingCategory.name
        }),
      });
      
      if (response.ok) {
        const updatedCategory = await response.json();
        setCategories(
          categories.map((cat) => 
            cat.id === updatedCategory.id ? updatedCategory : cat
          )
        );
        setEditingCategory(null);
        toast.success("Category updated successfully");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to update category");
      }
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("An error occurred while updating the category");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) {
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        setCategories(categories.filter((cat) => cat.id !== id));
        toast.success("Category deleted successfully");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to delete category");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("An error occurred while deleting the category");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="container py-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Manage Categories</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left column - Category list */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Categories</h2>
          
          {isLoading && categories.length === 0 ? (
            <p>Loading categories...</p>
          ) : categories.length === 0 ? (
            <p>No categories found. Create your first category to get started.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between border-b pb-2 font-medium">
                <span>Category</span>
                <span>Actions</span>
              </div>
              
              {categories.map((category) => (
                <div key={category.id} className="flex items-center justify-between py-2">
                  <div className="flex-1">
                    <CategoryBadge name={category.name} />
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={category.isDefault}
                      onClick={() => setEditingCategory(category)}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      disabled={category.isDefault}
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Right column - Create/Edit form */}
        <div>
          {editingCategory ? (
            <div className="border rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">Edit Category</h2>
              <form onSubmit={handleUpdateCategory} className="space-y-4">
                <div>
                  <label htmlFor="edit-name" className="block text-sm font-medium mb-1">
                    Category Name
                  </label>
                  <Input
                    id="edit-name"
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                    placeholder="e.g., Groceries"
                    disabled={isLoading}
                  />
                </div>
                
                <div className="pt-2 flex space-x-2">
                  <Button type="submit" disabled={isLoading}>
                    Update Category
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setEditingCategory(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="border rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">Create New Category</h2>
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div>
                  <label htmlFor="new-name" className="block text-sm font-medium mb-1">
                    Category Name
                  </label>
                  <Input
                    id="new-name"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                    placeholder="e.g., Groceries"
                    disabled={isLoading}
                  />
                </div>
                
                <div className="pt-2">
                  <Button type="submit" disabled={isLoading}>
                    Create Category
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="mt-8 p-4 border rounded-lg bg-muted/30">
            <h3 className="font-medium mb-2">About Categories</h3>
            <p className="text-sm text-muted-foreground">
              Categories help you organize your transactions. Each transaction can now be labeled as either "Income" or "Expense" separately from its category.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 