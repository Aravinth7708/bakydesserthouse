import { createFileRoute } from "@tanstack/react-router";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AttendanceBoard } from "@/components/dashboard/AttendanceBoard";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";

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
  return (
    <AuthGuard>
      <div className="flex h-full w-full overflow-hidden bg-white font-sans text-black">
        <Sidebar />
        <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar title="Staff Attendance" />
          <main className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3 sm:p-4 lg:p-6">
            <AttendanceBoard />
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
