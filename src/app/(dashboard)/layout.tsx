import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import UserSidebar from "@/components/UserSidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="flex">
      <UserSidebar />
      <main className="flex-1 bg-gray-950 text-white p-6">{children}</main>
    </div>
  );
}
