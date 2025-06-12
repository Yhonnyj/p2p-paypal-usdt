



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

  // Define the width of your sidebar here. Tailwind's w-64 is 256px.
  // Adjust this value to match the actual width of your UserSidebar component.
  const SIDEBAR_WIDTH_CLASS = 'w-64'; // Example: w-64 -> 256px
  const MAIN_CONTENT_ML_CLASS = 'ml-64'; // This must match SIDEBAR_WIDTH_CLASS

  return (
    // Main layout container: Applies the full-screen background gradient and positioning context
    <div className="flex min-h-screen relative bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white font-inter">
      {/* Background radial gradient, positioned absolutely to be behind everything */}
      <div className="absolute inset-0 z-0 opacity-20" style={{
        background: 'radial-gradient(circle at top left, #34D399, transparent), radial-gradient(circle at bottom right, #6366F1, transparent)',
      }}></div>

      {/* User Sidebar Container:
          - fixed: Stays in place when scrolling.
          - top-0 left-0 h-screen: Occupies full height on the left.
          - ${SIDEBAR_WIDTH_CLASS}: Sets its width (e.g., w-64).
          - z-[100]: Ensures it's on a very high layer, above all standard content and background.
          - bg-gray-900/90 backdrop-blur-sm: Added a subtle background for the sidebar itself,
            to ensure readability and separation from the main content's background.
      */}
      <div className={`fixed top-0 left-0 h-screen ${SIDEBAR_WIDTH_CLASS} z-[100] bg-gray-900/90 backdrop-blur-sm border-r border-gray-800`}>
        {/* Pass no className here, assume UserSidebar is styled internally or accepts no className */}
        <UserSidebar /> 
      </div>

      {/* Main content area:
          - flex-1: Takes up remaining horizontal space.
          - p-6: Standard padding (you can adjust this if needed per page).
          - relative z-10: Ensures it's above the background.
          - overflow-y-auto: Allows vertical scrolling if content exceeds height.
          - ${MAIN_CONTENT_ML_CLASS}: Pushes the main content area to the right,
            making space for the fixed sidebar.
      */}
      <main className={`flex-1 p-6 relative z-10 overflow-y-auto ${MAIN_CONTENT_ML_CLASS}`}>
        {children}
      </main>
    </div>
  );
}

