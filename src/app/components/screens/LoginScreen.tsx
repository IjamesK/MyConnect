import { useState } from "react";
import { useNavigate } from "react-router";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { Wifi, Eye, EyeOff, Lock, Phone } from "lucide-react";
import { auth } from "MyConnect/src/lib/firebase.ts";

export function LoginScreen() {
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
  e.preventDefault();
  setError("");

  if (!email.trim() || !password.trim()) {
    setError("Please enter both email and password.");
    return;
  }

  try {
    setLoading(true);

    await signInWithEmailAndPassword(auth, email.trim(), password);

    navigate("/dashboard", { replace: true });
  } catch (err: any) {
    console.error(err);

    if (err.code === "auth/invalid-credential") {
      setError("Invalid email or password.");
    } else if (err.code === "auth/invalid-email") {
      setError("Please enter a valid email address.");
    } else {
      setError("Login failed. Please try again.");
    }
  } finally {
    setLoading(false);
  }
}

async function handleForgotPassword() {
  setError("");

  if (!email.trim()) {
    setError("Enter your email first, then click forgot password.");
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email.trim());
    setError("Password reset email sent. Check your inbox.");
  } catch (err) {
    console.error(err);
    setError("Could not send reset email. Check the email and try again.");
  }
}

  return (
    <div className="min-h-screen bg-[#E5007D] flex flex-col items-center justify-center px-6 py-12">
      {/* Logo section */}
      <div className="flex flex-col items-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center mb-4 shadow-lg">
          <Wifi size={32} className="text-white" />
        </div>
        <h1
          style={{ fontFamily: "'Inter Tight', system-ui, sans-serif", fontWeight: 800 }}
          className="text-white text-3xl tracking-tight"
        >
          MyConnect
        </h1>
        <p className="text-white/80 text-sm mt-1">OWN YOUR NETWORK</p>
      </div>

      {/* Card */}
     <form
        onSubmit={handleLogin}
        className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 space-y-4"
      >
        <div>
          <h2
            style={{ fontFamily: "'Inter Tight', system-ui, sans-serif", fontWeight: 700 }}
            className="text-[#0F172A] text-xl"
          >
            Welcome back
          </h2>
          <p className="text-[#64748B] text-sm mt-0.5">Sign in to your account</p>
        </div>
        </form>
        {/* Customer ID input */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#475569] uppercase tracking-wide">Router Serial Number / Phone</label>
          <div className="relative">
            <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. customer@email.com"
              className="w-full pl-9 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] placeholder:text-[#CBD5E1] outline-none focus:border-[#E5007D] focus:ring-2 focus:ring-[#E5007D]/20 transition"
            />
          </div>
        </div>

        {/* Password input */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#475569] uppercase tracking-wide">Password</label>
          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type={showPass ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full pl-9 pr-10 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] placeholder:text-[#CBD5E1] outline-none focus:border-[#E5007D] focus:ring-2 focus:ring-[#E5007D]/20 transition"
            />
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-xs text-[#E5007D] font-medium hover:underline"
            >
              Forgot password?
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button className="text-xs text-[#E5007D] font-medium hover:underline">Forgot password?</button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#E5007D] hover:bg-[#BE0067] disabled:bg-[#E5007D]/60 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-colors shadow-sm active:scale-95"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <div className="text-center text-xs text-[#94A3B8]">
          Need help?{" "}
          <button className="text-[#E5007D] font-medium hover:underline">
            Call 032 6106800
          </button>
        </div>
      </div>

      {/* Staff link */}
      <button
        onClick={() => navigate("/staff")}
        className="mt-6 text-white/60 text-xs hover:text-white transition-colors"
      >
        Staff Login →
      </button>
    </div>
  );
}
