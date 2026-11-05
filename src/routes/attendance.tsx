import { createFileRoute } from "@tanstack/react-router";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AttendanceBoard } from "@/components/dashboard/AttendanceBoard";
import { StaffRestrictedView } from "@/components/dashboard/StaffRestrictedView";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/attendance")({
  head: () => ({
    meta: [
      { title: "Staff Attendance — Baky Dessert House" },
      {
        name: "description",
        content: "Record staff clock-in and clock-out times and calculate daily wages.",
      },
    ],
  }),
  component: AttendancePage,
});

function AttendancePage() {
  const { currentUser } = useStore();

  return (
    <AuthGuard>
      <div className="flex h-full w-full overflow-hidden bg-white font-sans text-black">
        <Sidebar />
        <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar title="Staff Attendance" />
          <main className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3 sm:p-4 lg:p-6">
            {currentUser?.role === "Staff" ? (
              <StaffRestrictedView pageName="Staff Attendance" />
            ) : (
              <AttendanceBoard />
            )}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
