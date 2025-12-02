"use client";

import { useMutation, useInfiniteQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useSales(
  filters: {
    limit?: number;
    deleted?: boolean;
    search?: string;
    searchBy?: string; // <-- ADD THIS
    payment?: string;
    product?: string;
    start?: string;
    end?: string;
    category?: string;
  } = {}
) {
  const { toast } = useToast();

  const salesQuery = useInfiniteQuery({
    queryKey: [
      "/api/sales/load",
      {
        limit: filters.limit ?? 20,
        deleted: filters.deleted ?? false,
        payment: filters.payment || undefined,
        product: filters.product || undefined,
        start: filters.start || undefined,
        end: filters.end || undefined,
        category: filters.category || undefined,
      },
    ],
    initialPageParam: null,
    queryFn: async ({ pageParam }) => {
      const qp = new URLSearchParams();
      qp.set("limit", String(filters.limit ?? 20));
      if (pageParam) qp.set("cursor", String(pageParam));
      if (filters.deleted !== undefined)
        qp.set("deleted", String(filters.deleted));
      if (filters.search) qp.set("search", filters.search);
      if (filters.searchBy) qp.set("searchBy", filters.searchBy);
      if (filters.payment) qp.set("payment", String(filters.payment));
      if (filters.product) qp.set("product", String(filters.product));
      if (filters.start) qp.set("start", String(filters.start));
      if (filters.end) qp.set("end", String(filters.end));
      if (filters.category) qp.set("category", String(filters.category));
      const res = await fetch(`/api/sales/load?${qp.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return await res.json(); // { data, nextCursor }
    },
    getNextPageParam: (lastPage: any) => lastPage?.nextCursor ?? undefined,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });

  const deleteSale = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/sales/${id}`).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales/load"] });
      toast({ title: "Sale Deleted", description: "Moved to trash." });
    },
  });

  const restoreSale = useMutation({
    mutationFn: (id: string) =>
      apiRequest("POST", `/api/sales/${id}/restore`).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales/load"] });
      toast({ title: "Sale Restored" });
    },
  });

  const permanentDelete = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/sales/${id}/permanent`).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales/load"] });
      toast({ title: "Permanent Delete Completed" });
    },
  });

  const returnSale = useMutation({
    mutationFn: (body: any) =>
      apiRequest("POST", "/api/sales/returns", body).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales/load"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Return Processed" });
    },
  });

  return {
    salesQuery,
    deleteSale,
    restoreSale,
    permanentDelete,
    returnSale,
  };
}
