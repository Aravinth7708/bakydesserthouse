import { useState } from "react";
import { useStore } from "@/lib/store";
import { X, UserCheck, ShieldCheck, Lock, Phone, User, KeyRound } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

interface SwitchUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SwitchUserModal({ isOpen, onClose }: SwitchUserModalProps) {
  const { currentUser, staff, loginAsStaff, switchToAdmin, logout } = useStore();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"StaffLogin" | "AdminLogin">(
    currentUser?.role === "Admin" ? "StaffLogin" : "AdminLogin"
  );
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  if (!isOpen) return null;

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) return;
    const success = await loginAsStaff(phone, password);
    if (success) {
      setPhone("");
      setPassword("");
      onClose();
      navigate({ to: "/pos" });
    }
  };

  const handleAdminSwitch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPassword) return;
    const success = switchToAdmin(adminPassword);
    if (success) {
      setAdminPassword("");
      onClose();
    }
  };

  const handleLogout = () => {
    logout();
    onClose();
    navigate({ to: "/login" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-3 sm:p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-5 border border-gray-200 sm:p-6 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-[#1177E5]" />
            <h3 className="text-lg font-bold text-gray-900 sm:text-xl">
              Switch Access / User
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current status pill */}
        <div className="my-4 rounded-xl bg-gray-50 border border-gray-200 p-3 flex items-center justify-between text-xs sm:text-sm">
          <span className="text-gray-600 font-medium">Current Active Role:</span>
          {currentUser?.role === "Admin" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 font-bold text-emerald-800">
              <ShieldCheck className="h-3.5 w-3.5" /> Admin (Full Access)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 font-bold text-blue-800">
              <User className="h-3.5 w-3.5" /> Staff: {currentUser?.staffMember?.name || "Staff"}
            </span>
          )}
        </div>

        {/* Mode Tabs */}
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1 mb-4 text-xs sm:text-sm font-semibold">
          <button
            type="button"
            onClick={() => setMode("StaffLogin")}
            className={`rounded-lg py-2 transition-all ${
              mode === "StaffLogin"
                ? "bg-white text-gray-900 border border-gray-200"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Staff Login
          </button>
          <button
            type="button"
            onClick={() => setMode("AdminLogin")}
            className={`rounded-lg py-2 transition-all ${
              mode === "AdminLogin"
                ? "bg-white text-gray-900 border border-gray-200"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Admin Switch
          </button>
        </div>

        {/* Staff Login Form */}
        {mode === "StaffLogin" ? (
          <form onSubmit={handleStaffLogin} className="space-y-4">
            <p className="text-xs text-gray-500">
              Enter staff phone number and password to access <strong>POS</strong> and <strong>Orders</strong> only.
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Staff Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm font-medium text-gray-900 focus:border-[#1177E5] focus:outline-none focus:ring-1 focus:ring-[#1177E5]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Staff Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="password"
                  required
                  placeholder="Enter staff password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm font-medium text-gray-900 focus:border-[#1177E5] focus:outline-none focus:ring-1 focus:ring-[#1177E5]"
                />
              </div>
            </div>

            {staff.length > 0 && (
              <div className="rounded-lg bg-blue-50/70 p-2.5 text-[11px] text-blue-900 border border-blue-100">
                <span className="font-semibold">Available Staff Members:</span>
                <ul className="mt-1 list-disc list-inside space-y-0.5">
                  {staff.map((s) => (
                    <li key={s.id}>
                      {s.name} ({s.phone})
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-[#1177E5] px-5 py-2 text-xs font-bold text-white hover:bg-blue-600 transition-all"
              >
                Login as Staff
              </button>
            </div>
          </form>
        ) : (
          /* Admin Switch Form */
          <form onSubmit={handleAdminSwitch} className="space-y-4">
            <p className="text-xs text-gray-500">
              Enter Admin Password to restore full management access (Dashboard, Menu, Inventory, Manage).
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Admin Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="password"
                  required
                  placeholder="Enter admin password (default: 1234)"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm font-medium text-gray-900 focus:border-[#1177E5] focus:outline-none focus:ring-1 focus:ring-[#1177E5]"
                />
              </div>
              <p className="mt-1 text-[11px] text-gray-400">Default admin password is <strong>1234</strong></p>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-all"
              >
                Switch to Admin
              </button>
            </div>
          </form>
        )}

        {/* Modal Logout Option */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-500">Finished your shift?</span>
          <button
            type="button"
            onClick={handleLogout}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline"
          >
            Log Out Completely
          </button>
        </div>
      </div>
    </div>
  );
}
