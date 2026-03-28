import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

export default function SignIn() {
  const navigate = useNavigate();
  const { user, role, loading, refreshAuth } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (user) {
      if (role === "contractor") {
        navigate("/contractor-dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [user, role, loading, navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert(error.message);
        setSubmitting(false);
        return;
      }

      await refreshAuth();
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Login failed:", err);
      alert("Login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm space-y-4 rounded-xl border bg-white p-6 shadow-sm"
      >
        <h1 className="text-2xl font-bold">Sign In</h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          required
          className="border p-2 w-full rounded"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          required
          className="border p-2 w-full rounded"
        />

        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white p-2 w-full rounded hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? "Signing In..." : "Sign In"}
        </button>

        <p className="text-sm text-slate-600">
          Need an account?{" "}
          <Link to="/sign-up" className="text-blue-600 hover:underline">
            Create one
          </Link>
        </p>
      </form>
    </div>
  );
}
