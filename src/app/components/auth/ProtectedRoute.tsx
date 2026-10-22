import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router";
import {
  onAuthChange,
  getUserProfile,
  type CustomerProfile,
} from "../../../lib/auth";

type ProtectedRouteProps = {
  children: ReactNode;
  allowedRoles?: CustomerProfile["role"][];
};

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      try {
        if (!user) {
          localStorage.removeItem("customerProfile");
          setProfile(null);
          setLoading(false);
          return;
        }

        const userProfile = await getUserProfile(user.uid);

        if (!userProfile) {
          localStorage.removeItem("customerProfile");
          setProfile(null);
          setLoading(false);
          return;
        }

        localStorage.setItem("customerProfile", JSON.stringify(userProfile));
        setProfile(userProfile);
      } catch (error) {
        console.error("Protected route error:", error);
        localStorage.removeItem("customerProfile");
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[var(--color-primary)]/20 border-t-[var(--color-primary)] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[var(--color-muted)] text-sm">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/" replace />;
  }

const userRole = profile.role?.toLowerCase().trim();

if (allowedRoles && !allowedRoles.includes(userRole as CustomerProfile["role"])) {
  return <Navigate to="/" replace />;
}

  return <>{children}</>;
}
