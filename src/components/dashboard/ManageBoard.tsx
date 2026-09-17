import { useState } from "react";
import { useStore, StaffMember } from "@/lib/store";
import { StaffModal } from "./StaffModal";
import { Plus, Trash2, Edit2, Shield, Phone, Key, UserCheck, Building } from "lucide-react";

export function ManageBoard() {
  const { staff, deleteStaff } = useStore();
  const [activeSection, setActiveSection] = useState<"Staff" | "Outlets">("Staff");
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<StaffMember | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenAdd = () => {
    setEditingStaff(null);
    setIsStaffModalOpen(true);
  };

  const handleOpenEdit = (s: StaffMember) => {
    setEditingStaff(s);
    setIsStaffModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingStaff) return;
    await deleteStaff(deletingStaff.id);
    setDeletingStaff(null);
  };

  const options = [
    {
      id: "Staff" as const,
      title: "Staff",
      description: "View users and their roles and responsibilities",
    },
    {
      id: "Outlets" as const,
      title: "Outlets",
      description: "Update outlet level informations",
    },
  ];

  return (
    <div className="flex flex-1 flex-col rounded-[15px] bg-baky-surface min-w-0">
      <div className="grid flex-1 grid-cols-1 md:grid-cols-2">
        {/* Admin options column */}
        <section className="flex flex-col p-3 md:p-5 lg:p-6 md:border-r md:border-baky-muted/50">
          <h2 className="text-base font-medium text-black md:text-xl lg:text-2xl">Admin</h2>

          <ul className="mt-3 border-t border-baky-muted/40 md:mt-4 lg:mt-6">
            {options.map((o) => (
              <li key={o.id}>
                <button
                  onClick={() => setActiveSection(o.id)}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-2.5 py-3.5 text-left transition-colors md:gap-4 md:py-5 lg:py-6 ${
                    activeSection === o.id
                      ? "bg-baky-card/80 font-medium"
                      : "hover:bg-baky-card/30"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-base font-medium text-black md:text-xl lg:text-2xl">
                      {o.title}
                    </p>
                    <p className="mt-0.5 text-xs font-light text-baky-muted md:text-sm lg:mt-1 lg:text-lg">
                      {o.description}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-lg font-bold md:text-xl lg:text-2xl ${
                      activeSection === o.id ? "text-[#1177E5]" : "text-baky-muted"
                    }`}
                  >
                    &gt;
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* Right detail section */}
        <section className="flex flex-col p-3 md:p-5 lg:p-6 min-w-0 border-t border-baky-muted/40 md:border-t-0">
          {activeSection === "Staff" ? (
            <div className="flex flex-1 flex-col min-w-0 space-y-4">
              {/* Staff Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-baky-muted/40 pb-3">
                <div>
                  <h3 className="text-base font-bold text-black md:text-lg lg:text-xl flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-[#1177E5]" />
                    Staff Accounts ({staff.length})
                  </h3>
                  <p className="text-xs text-baky-muted sm:text-sm">
                    Staff login requires Phone & Password to access POS and Orders only.
                  </p>
                </div>
                <button
                  onClick={handleOpenAdd}
                  className="flex items-center gap-1.5 rounded-xl bg-[#1177E5] px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-600 transition-all active:scale-95 shrink-0"
                >
                  <Plus className="h-4 w-4" /> Add Staff
                </button>
              </div>

              {/* Staff List */}
              {staff.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-baky-muted">
                  <Shield className="h-10 w-10 text-gray-300 mb-2" />
                  <p className="text-sm font-medium">No staff members created yet.</p>
                  <p className="text-xs mt-1">Click "+ Add Staff" to assign phone and password access.</p>
                </div>
              ) : (
                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  {staff.map((s) => (
                    <div
                      key={s.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-baky-muted/30 bg-white p-3.5 shadow-sm transition-all hover:border-[#1177E5]/40"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900 text-sm sm:text-base truncate">
                            {s.name}
                          </p>
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#1177E5] border border-blue-100">
                            POS & Orders Access
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 font-medium">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5 text-gray-400" />
                            {s.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <Key className="h-3.5 w-3.5 text-gray-400" />
                            Pass:{" "}
                            {visiblePasswords[s.id] ? (
                              <strong className="text-black font-mono">{s.password}</strong>
                            ) : (
                              "••••••••"
                            )}
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(s.id)}
                              className="ml-1 text-[10px] text-[#1177E5] underline"
                            >
                              {visiblePasswords[s.id] ? "hide" : "show"}
                            </button>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-[#1177E5] transition-colors"
                          title="Edit staff"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingStaff(s)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-700 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          title="Delete staff"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Outlets section */
            <div className="flex flex-1 flex-col space-y-4">
              <div className="border-b border-baky-muted/40 pb-3">
                <h3 className="text-base font-bold text-black md:text-lg lg:text-xl flex items-center gap-2">
                  <Building className="h-5 w-5 text-[#1177E5]" />
                  Outlet Information
                </h3>
                <p className="text-xs text-baky-muted sm:text-sm">
                  View and manage store branch configuration.
                </p>
              </div>

              <div className="rounded-2xl border border-baky-muted/30 bg-white p-4 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-gray-900 text-base">Baky Dessert House (Main Outlet)</h4>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                    Active
                  </span>
                </div>
                <p className="text-xs text-gray-600">Location: Main Store Counter</p>
                <p className="text-xs text-gray-600">Operating Hours: 10:00 AM – 11:00 PM</p>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Staff Modal */}
      <StaffModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        staffMember={editingStaff}
      />

      {/* Delete Confirmation Modal */}
      {deletingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="text-base font-bold text-gray-900">Remove Staff Member?</h3>
            <p className="mt-1 text-xs text-gray-600">
              Are you sure you want to remove <strong>{deletingStaff.name}</strong> ({deletingStaff.phone})? They will lose access to POS and Orders.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setDeletingStaff(null)}
                className="rounded-xl border border-gray-300 px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="rounded-xl bg-rose-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-rose-700"
              >
                Delete Staff
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
