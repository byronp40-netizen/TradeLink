import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate, Link } from "react-router-dom";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const signupResponse = await supabase.auth.signUp({
        email,
        password,
      });

      console.log("signUp response:", signupResponse);

      if (!signupResponse) {
        alert("Signup failed: no response returned from Supabase.");
        setLoading(false);
        return;
      }

      const { data, error } = signupResponse;

      if (error) {
        alert(`Signup failed: ${error.message}`);
        setLoading(false);
        return;
      }

      const user = data?.user;

      if (!user?.id) {
        alert("Signup succeeded but no user was returned. Check email confirmation settings in Supabase Auth.");
        setLoading(false);
        return;
      }

      const profileUpdateResponse = await supabase
        .from("profiles")
        .update({ role })
        .eq("id", user.id);

      console.log("profile update response:", profileUpdateResponse);

      if (profileUpdateResponse?.error) {
        alert(`Profile setup failed: ${profileUpdateResponse.error.message}`);
        setLoading(false);
        return;
      }

      if (role === "contractor") {
        const contractorInsertResponse = await supabase
          .from("contractor_profiles")
          .upsert({
            id: user.id,
            business_name: null,
            primary_trade: null,
            county: null,
            bio: null,
          });

        console.log("contractor profile response:", contractorInsertResponse);

        if (contractorInsertResponse?.error) {
          alert(`Contractor profile setup failed: ${contractorInsertResponse.error.message}`);
          setLoading(false);
          return;
        }

        navigate("/complete-contractor-profile");
      } else {
        navigate("/");
      }
    } catch (err: any) {
      console.error("signup error:", err);
      alert(`Signup failed: ${err?.message || "Unknown error"}`);
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSignup} className="space-y-4 w-80">
        <h1 className="text-2xl font-bold">Create Account</h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          required
          className="border p-2 w-full"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          required
          className="border p-2 w-full"
        />

        <select
          value={role}
          onChange={(e)=>setRole(e.target.value)}
          className="border p-2 w-full"
        >
          <option value="customer">Customer</option>
          <option value="contractor">Tradesperson</option>
        </select>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white p-2 w-full rounded"
        >
          {loading ? "Creating Account..." : "Sign Up"}
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