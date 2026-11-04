"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { DEFAULT_STORE_SETTINGS, type StoreSettings } from "@/types/store-settings";

export function useStoreSettings() {
  const { data, isLoading, refetch } = useQuery<{ ok: boolean; settings: StoreSettings }>({
    queryKey: ["/api/settings/billing"],
  });

  const settings: StoreSettings = data?.settings || DEFAULT_STORE_SETTINGS;

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<StoreSettings>) => {
      const res = await apiRequest("POST", "/api/settings/billing", newSettings);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/billing"] });
    },
  });

  return {
    settings,
    isLoading,
    refetch,
    updateSettings: updateSettingsMutation.mutateAsync,
    isUpdating: updateSettingsMutation.isPending,
  };
}
