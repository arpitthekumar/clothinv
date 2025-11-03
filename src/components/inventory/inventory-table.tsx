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
  const [editProduct, setEditProduct] = useState<Product | null>(null);
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
    <div className="sm:pb-36 lg:pb-0">
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
            <table className="w-full table-fixed md:table-auto">
              <thead className="hidden lg:table-header-group">
                <tr className="bg-muted ">
                  <th className="p-4 text-left w-[45%] md:w-auto">Product</th>
                  <th className="p-4 text-left hidden lg:table-cell">Category</th>
                  <th className="p-4 text-left hidden lg:table-cell">Size</th>
                  <th className="p-4 text-left">Stock</th>
                  <th className="p-4 text-left">Price</th>
                  <th className="p-4 text-left hidden sm:table-cell">Status</th>
                  <th className="p-4 text-left w-[120px] md:w-auto">Actions</th>
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
                      onEdit={(p) => setEditProduct(p)}
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
        isOpen={showAddModal || !!editProduct}
        onClose={() => { setShowAddModal(false); setEditProduct(null); }}
        initialProduct={editProduct || undefined}
      />
    </div>
    </>
  );
}
