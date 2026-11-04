import { redirect } from "next/navigation";

export default function SalespersonsSettingsPage() {
  redirect("/admin/users?tab=salespersons");
}
