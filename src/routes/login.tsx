import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import {
  ShieldCheck,
  UserCheck,
  Lock,
  Phone,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  Store,
  KeyRound,
} from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — Baky Dessert House" },
      {
        name: "description",
        content: "Sign in to Baky Dessert House Management Dashboard and Point of Sale.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { currentUser, staff, loginAsAdmin, loginAsStaff } = useStore();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"Admin" | "Staff">("Admin");
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const [staffPhone, setStaffPhone] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // If already authenticated, redirect to appropriate page
  useEffect(() => {
    if (currentUser?.isAuthenticated) {
      if (currentUser.role === "Staff") {
        navigate({ to: "/pos" });
      } else {
        navigate({ to: "/" });
      }
    }
  }, [currentUser, navigate]);

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPassword.trim()) return;
    setIsLoading(true);
    const success = loginAsAdmin(adminPassword);
    setIsLoading(false);
    if (success) {
      navigate({ to: "/" });
    }
  };

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffPhone.trim() || !staffPassword.trim()) return;
    setIsLoading(true);
    const success = await loginAsStaff(staffPhone, staffPassword);
    setIsLoading(false);
    if (success) {
      navigate({ to: "/pos" });
    }
  };

  const handleQuickFillAdmin = () => {
    setAdminPassword("1234");
  };

  const handleQuickSelectStaff = (phone: string, pass: string) => {
    setStaffPhone(phone);
    setStaffPassword(pass);
  };

  return (
    <div className="login-page-wrapper flex min-h-screen w-full flex-col justify-between bg-baky-surface font-sans text-black selection:bg-[#1177E5] selection:text-white">
      {/* Top Navbar */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-8 lg:px-12">
        <div className="flex items-center gap-3">
          <img
            src="/baky-logo.png"
            alt="Baky Logo"
            className="h-11 w-11 shrink-0 object-contain"
          />
          <div className="flex flex-col justify-center leading-tight">
            <h1 className="text-base font-bold text-gray-900 sm:text-lg">
              Baky Dessert House
            </h1>
            <p className="text-[11px] font-medium text-gray-500">
              Management Portal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-1.5 text-xs font-semibold text-gray-700">
          <Store className="h-4 w-4 text-[#1177E5]" />
          <span className="hidden sm:inline">Main Counter Outlet</span>
          <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
        </div>
      </header>

      {/* Main Login Area */}
      <main className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-[460px] rounded-2xl border border-gray-200 bg-white p-7 sm:p-9 my-auto">
          {/* Header Icon & Title */}
          <div className="flex flex-col items-center text-center">
            <img
              src="/baky-logo.png"
              alt="Baky Logo"
              className="mb-2 h-20 w-20 shrink-0 object-contain"
            />
            <h2 className="text-2xl font-bold text-gray-900">
              Sign In to Baky
            </h2>
            <p className="mt-1 text-xs text-gray-500 sm:text-sm">
              Select your role to access Point of Sale & Management
            </p>

            {/* Role Tabs */}
            <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-gray-100/90 p-1 text-xs font-bold sm:text-sm border border-gray-200/80 w-full">
              <button
                type="button"
                onClick={() => setMode("Admin")}
                className={`flex items-center justify-center gap-2 rounded-lg py-2.5 sm:py-3 transition-colors ${
                  mode === "Admin"
                    ? "bg-white text-gray-900 border border-gray-200/80 font-extrabold"
                    : "text-gray-500 hover:text-gray-900 font-semibold hover:bg-white/50"
                }`}
              >
                <ShieldCheck
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    mode === "Admin" ? "text-[#1177E5]" : "text-gray-400"
                  }`}
                />
                <span>Admin</span>
              </button>
              <button
                type="button"
                onClick={() => setMode("Staff")}
                className={`flex items-center justify-center gap-2 rounded-lg py-2.5 sm:py-3 transition-colors ${
                  mode === "Staff"
                    ? "bg-white text-gray-900 border border-gray-200/80 font-extrabold"
                    : "text-gray-500 hover:text-gray-900 font-semibold hover:bg-white/50"
                }`}
              >
                <UserCheck
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    mode === "Staff" ? "text-[#1177E5]" : "text-gray-400"
                  }`}
                />
                <span>Staff</span>
              </button>
            </div>
          </div>

          {/* Form Area */}
          <div className="mt-6">
            {mode === "Admin" ? (
              /* Admin Login Form */
              <form onSubmit={handleAdminSubmit} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-gray-700">
                      Admin Password
                    </label>
                    <button
                      type="button"
                      onClick={handleQuickFillAdmin}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1177E5] hover:underline"
                    >
                      <Sparkles className="h-3 w-3" /> Quick fill (1234)
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type={showAdminPassword ? "text" : "password"}
                      required
                      autoFocus
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Enter admin password (1234)"
                      className="w-full rounded-xl border border-gray-300 bg-white pl-10 pr-10 py-2.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-[#1177E5] focus:outline-none focus:ring-1 focus:ring-[#1177E5] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showAdminPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="rounded-xl bg-gray-50 p-3 border border-gray-200 text-[11px] text-gray-600 leading-relaxed">
                  <span className="font-bold text-gray-900">Admin Access:</span> Complete control over Sales Dashboard, Orders, POS, Menu, Stock Inventory & Staff Settings.
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-black py-2.5 text-sm font-bold text-white hover:bg-gray-800 transition-colors active:scale-[0.99] disabled:opacity-50"
                >
                  <span>Sign In as Admin</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            ) : (
              /* Staff Login Form */
              <form onSubmit={handleStaffSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Staff Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="tel"
                      required
                      autoFocus
                      value={staffPhone}
                      onChange={(e) => setStaffPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full rounded-xl border border-gray-300 bg-white pl-10 pr-4 py-2.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-[#1177E5] focus:outline-none focus:ring-1 focus:ring-[#1177E5] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Staff Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type={showStaffPassword ? "text" : "password"}
                      required
                      value={staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                      placeholder="Enter staff password"
                      className="w-full rounded-xl border border-gray-300 bg-white pl-10 pr-10 py-2.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-[#1177E5] focus:outline-none focus:ring-1 focus:ring-[#1177E5] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowStaffPassword(!showStaffPassword)}
                      className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showStaffPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {staff.length > 0 && (
                  <div className="rounded-xl bg-gray-50 p-3 border border-gray-200 text-[11px] text-gray-700 space-y-1.5">
                    <span className="font-bold flex items-center gap-1 text-gray-900">
                      <Sparkles className="h-3.5 w-3.5 text-[#1177E5]" />
                      Quick Select Registered Staff:
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {staff.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => handleQuickSelectStaff(s.phone, s.password)}
                          className="rounded-lg bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-800 border border-gray-300 hover:border-[#1177E5] hover:text-[#1177E5] transition-colors"
                        >
                          {s.name} ({s.phone})
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1177E5] py-2.5 text-sm font-bold text-white hover:bg-blue-600 transition-colors active:scale-[0.99] disabled:opacity-50"
                >
                  <span>Sign In as Staff</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="border-t border-gray-200 bg-white py-4 text-center">
        <p className="text-xs font-semibold text-gray-500">
          Baky Dessert House · The Home of Desserts <span className="text-[#F88484]">♥</span>
        </p>
      </footer>
    </div>
  );
}
