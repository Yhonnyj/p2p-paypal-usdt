// app/admin/dashboard/page.tsx
import DashboardStats from "@/components/admin/DashboardStats";

export default function AdminDashboardPage() {
  return (
    <div className="px-6 py-8">
      <h1 className="text-2xl font-semibold text-white">📊 Reporte general</h1>
      <DashboardStats />
    </div>
  );
}
