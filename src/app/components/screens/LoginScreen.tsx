import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { Wifi, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../../lib/firebase";
import { signIn } from "../../../lib/auth";

export function LoginScreen() {
  const navigate = useNavigate();

  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setMessage("");

    if (!email.trim() || !password.trim()) {
      setMessage("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);

      const profile = await signIn(email.trim(), password);

      localStorage.setItem("customerProfile", JSON.stringify(profile));

        const role = profile.role?.toLowerCase().trim();
        
        if (role === "staff" || role === "admin") {
          navigate("/staff", { replace: true });
          return;
        }
        
        navigate("/dashboard", { replace: true });

    } catch (err) {
      console.error(err);

      if (err instanceof Error && err.message === "PROFILE_NOT_FOUND") {
      setMessage("Login worked, but no customer profile was found. Check Firestore UID.");
      return;
    } 

      const errorCode =
        typeof err === "object" && err !== null && "code" in err
          ? String((err as { code?: string }).code)
          : "";

      if (errorCode === "auth/invalid-email") {
        setMessage("Please enter a valid email address.");
      } else if (errorCode === "auth/invalid-credential") {
        setMessage("Invalid email or password.");
      } else {
        setMessage("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    setMessage("");

    if (!email.trim()) {
      setMessage("Enter your email first, then click forgot password.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMessage("Password reset email sent. Check your inbox.");
    } catch (err) {
      console.error(err);
      setMessage("Could not send reset email. Check the email and try again.");
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[var(--color-bg)] text-[var(--color-text)] flex flex-col items-center justify-center px-4 sm:px-6 py-12">
      {/* Logo section */}
      <div className="flex flex-col items-center mb-7">
        <div className="w-14 h-14 rounded-2xl bg-[var(--color-primary)] flex items-center justify-center mb-4 shadow-sm">
          <Wifi size={32} className="text-white" />
        </div>

        <h1
          style={{
            fontFamily: "'Inter Tight', system-ui, sans-serif",
            fontWeight: 800,
          }}
          className="text-[var(--color-text)] text-3xl tracking-tight"
        >
          MyConnect
        </h1>

        <p className="text-[var(--color-muted)] text-xs font-semibold tracking-[0.14em] mt-1">OWN YOUR NETWORK</p>
      </div>

      {/* Card */}
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl shadow-sm p-6 sm:p-8 space-y-5"
      >
        <div>
          <h2
            style={{
              fontFamily: "'Inter Tight', system-ui, sans-serif",
              fontWeight: 700,
            }}
            className="text-[var(--color-text)] text-xl"
          >
            Welcome back
          </h2>

          <p className="text-[var(--color-muted)] text-sm mt-0.5">
            Sign in to your account
          </p>
        </div>

        {/* Email input */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wide">
            Email Address
          </label>

          <div className="relative">
            <Mail
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-subtle-text)]"
            />

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. customer@email.com"
              className="w-full pl-9 pr-4 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] placeholder:text-[var(--color-subtle-text)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition"
            />
          </div>
        </div>

        {/* Password input */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wide">
            Password
          </label>

          <div className="relative">
            <Lock
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-subtle-text)]"
            />

            <input
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full pl-9 pr-10 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] placeholder:text-[var(--color-subtle-text)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition"
            />

            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-subtle-text)] hover:text-[var(--color-muted)]"
            >
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {message && (
          <div className="text-xs bg-[var(--color-danger-soft)] text-[var(--color-danger-strong)] border border-[var(--color-danger-border)] rounded-lg px-3 py-2">
            {message}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-xs text-[var(--color-primary-text)] font-medium hover:underline"
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary)] disabled:bg-[var(--color-primary)]/60 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-colors shadow-sm active:scale-95"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <div className="text-center text-xs text-[var(--color-subtle-text)]">
          Need help?{" "}
          <button
            type="button"
            className="text-[var(--color-primary-text)] font-medium hover:underline"
          >
            Call 032 6106800
          </button>
        </div>
      </form>

      {/* Staff link */}
      <button
        type="button"
        onClick={() => navigate("/staff")}
        className="mt-6 text-[var(--color-muted)] text-xs hover:text-[var(--color-primary-text)] transition-colors"
      >
        Staff Login →
      </button>
    </div>
  );
}
