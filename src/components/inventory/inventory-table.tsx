"use client";

import { useMemo, useState } from "react";
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

  const { data: sales = [] } = useQuery<any[]>({
    queryKey: ["/api/sales"],
  });

  const productStats = useMemo(() => {
    const map = new Map<string, { revenue: number; cost: number; profit: number; quantity: number }>();
    const productMap = new Map<string, Product>();
    products.forEach((p) => {
      productMap.set(p.id, p);
    });

    (sales || []).forEach((sale: any) => {
      if (!sale?.items) return;
      let items: any[] = [];
      try {
        items = Array.isArray(sale.items) ? sale.items : JSON.parse(sale.items || "[]");
      } catch {
        return;
      }

      const saleRevenue = Number(sale.total_amount || 0);
      const itemRevenues = items.map((it: any) => Number(it.quantity || 0) * Number(it.price || 0));
      const totalItemRevenue = itemRevenues.reduce((sum, val) => sum + val, 0);

      items.forEach((item: any, index: number) => {
        const productId = item.productId;
        if (!productId) return;
        const qty = Number(item.quantity || 0);
        const rawItemRevenue = itemRevenues[index] || 0;
        const effectiveRevenue =
          totalItemRevenue > 0 ? (rawItemRevenue / totalItemRevenue) * saleRevenue : rawItemRevenue;

        const product = productMap.get(productId);
        const buyingPrice = product ? Number((product as any).buyingPrice ?? product.price ?? 0) : 0;
        const cost = qty * buyingPrice;
        const profit = effectiveRevenue - cost;

        const current = map.get(productId) || { revenue: 0, cost: 0, profit: 0, quantity: 0 };
        current.revenue += effectiveRevenue;
        current.cost += cost;
        current.profit += profit;
        current.quantity += qty;
        map.set(productId, current);
      });
    });

    return map;
  }, [sales, products]);

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
                  <th className="p-4 text-left w-[120px] md:w-auto">Actions</th>
                  <th className="p-4 text-left hidden lg:table-cell">Size</th>
                  <th className="p-4 text-left">Stock</th>
                  <th className="p-4 text-left">Price</th>
                  <th className="p-4 text-left hidden lg:table-cell">Total Profit</th>
                  <th className="p-4 text-left hidden sm:table-cell">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8">
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
                      stats={productStats.get(product.id)}
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
