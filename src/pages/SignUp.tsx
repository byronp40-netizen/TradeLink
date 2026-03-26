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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        alert(error.message);
        setLoading(false);
        return;
      }

      const user = data.user;

      if (!user) {
        alert("User creation failed.");
        setLoading(false);
        return;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ role })
        .eq("id", user.id);

      if (profileError) {
        console.error(profileError);
        alert("Profile setup failed.");
        setLoading(false);
        return;
      }

      if (role === "contractor") {
        const { error: contractorProfileError } = await supabase
          .from("contractor_profiles")
          .insert({
            id: user.id,
            business_name: null,
            primary_trade: null,
            county: null,
            bio: null,
          });

        if (contractorProfileError) {
          console.error(contractorProfileError);
          alert("Contractor profile setup failed.");
          setLoading(false);
          return;
        }
      }

      if (role === "contractor") {
        navigate("/complete-contractor-profile");
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error(err);
      alert("Signup failed.");
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