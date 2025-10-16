"use client";

import { Search, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InventoryHeaderProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  categories: any[];
  showTrash: boolean;
  setShowTrash: (val: boolean) => void;
  setShowAddModal: (val: boolean) => void;
}

export function InventoryHeader({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  categories,
  showTrash,
  setShowTrash,
  setShowAddModal,
}: InventoryHeaderProps) {
  return (
    <div className="space-y-6">
      {/* ✅ Title Section */}
      <div>
        <h3 className="text-lg font-semibold">Inventory Management</h3>
        <p className="text-sm text-muted-foreground">
          Manage your products and stock levels
        </p>
      </div>

      {/* ✅ Controls Section */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-grow min-w-[180px] sm:min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>

        {/* Category Filter */}
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48 md:w-56">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories?.map((category: any) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Trash Toggle */}
        <Button
          variant={showTrash ? "destructive" : "outline"}
          onClick={() => setShowTrash(!showTrash)}
          className="w-full sm:w-auto"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {showTrash ? "Active Products" : "Trash"}
        </Button>

        {/* Add Product */}
        {!showTrash && (
          <Button
            onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        )}
      </div>
    </div>
  );
}
