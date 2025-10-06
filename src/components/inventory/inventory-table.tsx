"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Product } from "@shared/schema";
import { AddProductModal } from "./add-product-modal";
import { InventoryHeader } from "./inventory-header";
import { InventoryRow } from "./inventory-row";
import { InventorySkeleton } from "./inventory-skeleton";
import { InventoryPagination } from "./inventory-pagination";

export function InventoryTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showTrash, setShowTrash] = useState(false);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", { includeDeleted: showTrash }],
  });

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  if (isLoading) {
    return <InventorySkeleton />;
  }

  // Filtering
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || p.categoryId === selectedCategory;
    const matchesTrash = showTrash ? p.deleted : !p.deleted;
    return matchesSearch && matchesCategory && matchesTrash;
  });

  // Pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  return (
    <>
      <Card>
        <CardHeader>
          <InventoryHeader
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            categories={categories}
            showTrash={showTrash}
            setShowTrash={setShowTrash}
            setShowAddModal={setShowAddModal}
          />
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted">
                  <th className="p-4 text-left">Product</th>
                  <th className="p-4 text-left">Category</th>
                  <th className="p-4 text-left">Size</th>
                  <th className="p-4 text-left">Stock</th>
                  <th className="p-4 text-left">Price</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8">
                      No products found.
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((product) => (
                    <InventoryRow
                      key={product.id}
                      product={product}
                      categories={categories}
                      showTrash={showTrash}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <InventoryPagination
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalPages={totalPages}
              totalItems={filteredProducts.length}
              itemsPerPage={itemsPerPage}
            />
          )}
        </CardContent>
      </Card>

      <AddProductModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </>
  );
}
