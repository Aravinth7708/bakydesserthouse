import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useStore } from "@/lib/store";

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { currentUser } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser || !currentUser.isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [currentUser, navigate]);

  if (!currentUser || !currentUser.isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-baky-surface font-sans">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative flex h-16 w-16 items-center justify-center">
            <img
              src="/baky-logo.png"
              alt="Baky Logo"
              className="h-14 w-14 rounded-full object-cover animate-pulse"
            />
          </div>
          <p className="text-sm font-medium text-gray-500">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
