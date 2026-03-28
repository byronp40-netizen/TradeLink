import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

export default function SignUp() {
  const navigate = useNavigate();
  const { user, role, loading, refreshAuth } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountRole, setAccountRole] = useState<"customer" | "contractor">("customer");
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

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        alert(error.message);
        setSubmitting(false);
        return;
      }

      const newUser = data.user;

      if (!newUser?.id) {
        alert("Signup succeeded but no user record was returned.");
        setSubmitting(false);
        return;
      }

      const profileUpdate = await supabase
        .from("profiles")
        .update({ role: accountRole })
        .eq("id", newUser.id);

      if (profileUpdate.error) {
        alert(`Profile setup failed: ${profileUpdate.error.message}`);
        setSubmitting(false);
        return;
      }

      if (accountRole === "contractor") {
        const contractorProfileUpsert = await supabase
          .from("contractor_profiles")
          .upsert({
            id: newUser.id,
            business_name: null,
            primary_trade: null,
            county: null,
            bio: null,
          });

        if (contractorProfileUpsert.error) {
          alert(
            `Contractor profile setup failed: ${contractorProfileUpsert.error.message}`
          );
          setSubmitting(false);
          return;
        }
      }

      await refreshAuth();

      if (accountRole === "contractor") {
        navigate("/complete-contractor-profile", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err: any) {
      console.error("Signup failed:", err);
      alert(`Signup failed: ${err?.message || "Unknown error"}`);
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
        onSubmit={handleSignup}
        className="w-full max-w-sm space-y-4 rounded-xl border bg-white p-6 shadow-sm"
      >
        <h1 className="text-2xl font-bold">Create Account</h1>

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

        <select
          value={accountRole}
          onChange={(e) => setAccountRole(e.target.value as "customer" | "contractor")}
          className="border p-2 w-full rounded"
        >
          <option value="customer">Customer</option>
          <option value="contractor">Tradesperson</option>
        </select>

        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white p-2 w-full rounded hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? "Creating Account..." : "Sign Up"}
        </button>

        <p className="text-sm text-slate-600">
          Already have an account?{" "}
          <Link to="/sign-in" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
