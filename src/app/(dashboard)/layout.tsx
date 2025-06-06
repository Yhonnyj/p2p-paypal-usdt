import UserSidebar from "@/components/UserSidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <UserSidebar />
      <main className="flex-1 bg-gray-950 text-white p-6">{children}</main>
    </div>
  );
}
