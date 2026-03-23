"use client";

import { SupabaseProfileCard } from "@/components/settings/supabase-profile-card";
import { SecondarySyncCard } from "@/components/settings/secondary-sync-card";

export function DatabaseSettingsSection() {
  return (
    <>
      <SupabaseProfileCard />
      <SecondarySyncCard />
    </>
  );
}
