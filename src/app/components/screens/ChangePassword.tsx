import { useState } from "react";
import { AlertTriangle, CheckCircle, Eye, EyeOff, LockKeyhole, RefreshCw, ShieldCheck } from "lucide-react";
import { Layout } from "../isp/Layout";
import { changePassword } from "../../../lib/auth";

function friendlyPasswordError(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code) : "";
  const message = error instanceof Error ? error.message : "";

  if (code.includes("wrong-password") || code.includes("invalid-credential")) {
    return "The current password is incorrect. Please check it and try again.";
  }

  if (code.includes("weak-password")) {
    return "The new password is too weak. Use at least 8 characters.";
  }

  if (code.includes("requires-recent-login") || message === "AUTH_REQUIRED") {
    return "For security, please sign in again and then try changing your password.";
  }

  if (code.includes("network-request-failed")) {
    return "Please check your internet connection and try again.";
  }

  return "Password could not be changed. Please try again.";
}

export function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const inputType = showPasswords ? "text" : "password";

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!currentPassword.trim()) {
      setError("Please enter your current password.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Your new password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("Choose a new password that is different from your current password.");
      return;
    }

    try {
      setLoading(true);
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess("Password changed successfully. Use the new password next time you sign in.");
    } catch (err) {
      console.error("Change password failed:", err);
      setError(friendlyPasswordError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout showBack backTo="/settings" title="Account Security">
      <div className="px-4 py-5 space-y-5">
        <div>
          <h1
            style={{
              fontFamily: "'Inter Tight', system-ui, sans-serif",
              fontWeight: 800,
            }}
            className="text-[var(--color-text)] text-2xl"
          >
            Change Password
          </h1>

          <p className="text-[var(--color-muted)] text-sm mt-1">
            Enter your current password, then choose a new one.
          </p>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-soft)] flex items-center justify-center shrink-0">
              <LockKeyhole size={20} className="text-[var(--color-primary)]" />
            </div>

            <div className="flex-1">
              <p className="text-[var(--color-text)] text-sm font-bold">
                Password details
              </p>
              <p className="text-[var(--color-muted)] text-xs mt-0.5 leading-relaxed">
                For security, your old password must be confirmed before the new password is saved.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block">
              <span className="text-[var(--color-text)] text-xs font-semibold">
                Current password
              </span>
              <input
                type={inputType}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="mt-2 w-full px-3 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition"
              />
            </label>

            <label className="block">
              <span className="text-[var(--color-text)] text-xs font-semibold">
                New password
              </span>
              <input
                type={inputType}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="mt-2 w-full px-3 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition"
              />
            </label>

            <label className="block">
              <span className="text-[var(--color-text)] text-xs font-semibold">
                Confirm new password
              </span>
              <input
                type={inputType}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="mt-2 w-full px-3 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={() => setShowPasswords((value) => !value)}
            className="mt-3 text-[var(--color-primary)] text-xs font-semibold flex items-center gap-1"
          >
            {showPasswords ? <EyeOff size={14} /> : <Eye size={14} />}
            {showPasswords ? "Hide passwords" : "Show passwords"}
          </button>
        </div>

        <div className="bg-[var(--color-surface-soft)] border border-[var(--color-border)] rounded-2xl p-4 flex gap-3">
          <ShieldCheck size={18} className="text-[var(--color-primary)] shrink-0 mt-0.5" />
          <p className="text-[var(--color-muted)] text-xs leading-relaxed">
            MyConnect does not store your password in the customer profile. Password changes are handled securely through the login system.
          </p>
        </div>

        {(error || success) && (
          <div
            className={`rounded-xl border px-3 py-2 text-xs flex items-start gap-2 ${
              error
                ? "bg-red-50 text-red-600 border-red-200"
                : "bg-green-50 text-green-700 border-green-200"
            }`}
          >
            {error ? <AlertTriangle size={14} className="shrink-0 mt-0.5" /> : <CheckCircle size={14} className="shrink-0 mt-0.5" />}
            <span>{error || success}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] disabled:bg-[var(--color-primary)]/60 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
        >
          {loading && <RefreshCw size={15} className="animate-spin" />}
          {loading ? "Updating password..." : "Update Password"}
        </button>
      </div>
    </Layout>
  );
}
