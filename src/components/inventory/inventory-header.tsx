"use client";

import { Search, Plus, Trash2, RotateCcw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
      <div>
        <h3 className="text-lg font-semibold">Inventory Management</h3>
        <p className="text-sm text-muted-foreground">
          Manage your products and stock levels
        </p>
      </div>

      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full sm:w-64"
          />
        </div>

        {/* Category Filter */}
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
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
          className="mr-2"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {showTrash ? "Active Products" : "Trash"}
        </Button>

        {/* Add Product */}
        {!showTrash && (
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        )}

        {/* Quick Receive
        {!showTrash && (
          <Link href="/purchasing#receive">
            <Button variant="outline">
              <RotateCcw className="mr-2 h-4 w-4" />
              Quick Receive
            </Button>
          </Link>
        )} */}
      </div>
    </div>
  );
}
