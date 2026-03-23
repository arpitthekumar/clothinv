"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Search, Folder, AlertCircle, Edit } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AddCategoryModal } from "@/components/shared/add-category-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EditCategoryModal } from "../shared/edit-category-modal";
import { tailwindBorderMap, tailwindColorMap } from "@/lib/colors";

export function CategoriesManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<any>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<any>(null);
  const { toast } = useToast();

  const { data: categories = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const { data: products = [] } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const response = await apiRequest(
        "DELETE",
        `/api/categories?id=${categoryId}`
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete category");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      toast({
        title: "Category Deleted",
        description: "Category deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Cannot Delete Category",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check how many products use each category
  const getProductCount = (categoryId: string) => {
    return products.filter(
      (p: any) => p.categoryId === categoryId && !p.deleted
    ).length;
  };

  const handleDeleteClick = (category: any) => {
    const productCount = getProductCount(category.id);
    if (productCount > 0) {
      toast({
        title: "Cannot Delete Category",
        description: `This category is being used by ${productCount} product(s). Please remove the category from all products first.`,
        variant: "destructive",
      });
      return;
    }
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (categoryToDelete) {
      deleteCategoryMutation.mutate(categoryToDelete.id);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading categories...
      </div>
    );
  }

  return (
    <div className="space-y-4 px-2 sm:px-0">

      {/* SEARCH + BUTTON */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Button
          onClick={() => setShowAddModal(true)}
          className="w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* LIST */}
      {filteredCategories.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm
            ? "No categories found matching your search"
            : "No categories found. Add your first category!"}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCategories.map((category) => {
            const productCount = getProductCount(category.id);
            const canDelete = productCount === 0;

            return (
              <Card
                key={category.id}
                className={`${tailwindBorderMap[category.color]}`}
              >
                <CardContent className="p-3 sm:p-4">

                  {/* MAIN FLEX */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                    {/* LEFT */}
                    <div className="flex items-start gap-3 min-w-0 flex-1">

                      <Folder className="h-5 w-5 text-primary flex-shrink-0" />

                      <div className="min-w-0 flex-1">

                        {/* 🔥 NAME FIX */}
                        <h3 className="font-semibold text-sm sm:text-base break-words leading-tight">
                          {category.name}
                        </h3>

                        {category.description && (
                          <p className="text-xs sm:text-sm text-muted-foreground break-words">
                            {category.description}
                          </p>
                        )}

                        {/* BADGES */}
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant={canDelete ? "secondary" : "outline"}>
                            {productCount}{" "}
                            {productCount === 1 ? "product" : "products"}
                          </Badge>

                          {!canDelete && (
                            <Badge
                              variant="destructive"
                              className="text-xs flex items-center gap-1"
                            >
                              <AlertCircle className="h-3 w-3" />
                              In use
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex gap-2 w-full sm:w-auto flex-shrink-0">

                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 sm:flex-none"
                        onClick={() => {
                          setEditCategory(category);
                          setEditModalOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1 sm:flex-none"
                        onClick={() => handleDeleteClick(category)}
                        disabled={
                          !canDelete || deleteCategoryMutation.isPending
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* MODALS (unchanged) */}
      <AddCategoryModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />

      <EditCategoryModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        category={editCategory}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{categoryToDelete?.name}"?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
