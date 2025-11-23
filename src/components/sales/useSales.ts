"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useSales() {
  const { toast } = useToast();

  const salesQuery = useQuery({
    queryKey: ["/api/sales", { includeDeleted: true }],
    queryFn: async () => {
      const response = await fetch("/api/sales?includeDeleted=true");
      if (!response.ok) return [];
      return response.json();
    },
  });

  const deleteSale = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/sales/${id}`).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      toast({ title: "Sale Deleted", description: "Moved to trash." });
    },
  });

  const restoreSale = useMutation({
    mutationFn: (id: string) =>
      apiRequest("POST", `/api/sales/${id}/restore`).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      toast({ title: "Sale Restored" });
    },
  });

  const permanentDelete = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/sales/${id}/permanent`).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      toast({ title: "Permanent Delete Completed" });
    },
  });

  const returnSale = useMutation({
    mutationFn: (body: any) =>
      apiRequest("POST", "/api/sales/returns", body).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Return Processed" });
    },
  });

  return { salesQuery, deleteSale, restoreSale, permanentDelete, returnSale };
}
