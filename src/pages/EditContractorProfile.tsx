import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

type FormState = {
  business_name: string;
  primary_trade: string;
  county: string;
  bio: string;
};

export default function EditContractorProfile() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    business_name: "",
    primary_trade: "",
    county: "",
    bio: "",
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) throw error;

        if (!user) {
          navigate("/sign-in");
          return;
        }

        setUserId(user.id);

        const { data: profile, error: profileError } = await supabase
          .from("contractor_profiles")
          .select("business_name, primary_trade, county, bio")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error(profileError);
          alert("Failed to load contractor profile.");
          navigate("/contractor-dashboard");
          return;
        }

        setForm({
          business_name: profile?.business_name || "",
          primary_trade: profile?.primary_trade || "",
          county: profile?.county || "",
          bio: profile?.bio || "",
        });
      } catch (err) {
        console.error("Failed to load contractor profile:", err);
        alert("Failed to load contractor profile.");
        navigate("/contractor-dashboard");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [navigate]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!userId) {
      alert("You must be signed in.");
      return;
    }

    if (!form.primary_trade.trim()) {
      alert("Primary trade is required.");
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from("contractor_profiles")
        .update({
          business_name: form.business_name.trim() || null,
          primary_trade: form.primary_trade.trim().toLowerCase(),
          county: form.county.trim() || null,
          bio: form.bio.trim() || null,
        })
        .eq("id", userId);

      if (error) {
        console.error(error);
        alert("Failed to update contractor profile.");
        setSaving(false);
        return;
      }

      navigate("/contractor-dashboard");
    } catch (err) {
      console.error(err);
      alert("Failed to update contractor profile.");
    }

    setSaving(false);
  }

  if (loading) {
    return <div className="p-6">Loading contractor profile...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl space-y-4 rounded-xl border bg-white p-6 shadow-sm"
      >
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Edit Contractor Profile</h1>

          <button
            type="button"
            onClick={() => navigate("/contractor-dashboard")}
            className="rounded-md border px-4 py-2 text-sm hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>

        <p className="text-sm text-slate-600">
          Update your business details and service information.
        </p>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Business Name
          </label>
          <input
            type="text"
            value={form.business_name}
            onChange={(e) => updateField("business_name", e.target.value)}
            className="w-full rounded-md border p-2"
            placeholder="Example Plumbing Services"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Primary Trade *
          </label>
          <input
            type="text"
            value={form.primary_trade}
            onChange={(e) => updateField("primary_trade", e.target.value)}
            className="w-full rounded-md border p-2"
            placeholder="plumbing"
            required
          />
          <p className="mt-1 text-xs text-slate-500">
            Use the same naming style as jobs and matching logic, for example
            plumbing, electrical, carpentry, roofing.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            County
          </label>
          <input
            type="text"
            value={form.county}
            onChange={(e) => updateField("county", e.target.value)}
            className="w-full rounded-md border p-2"
            placeholder="Galway"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Bio
          </label>
          <textarea
            value={form.bio}
            onChange={(e) => updateField("bio", e.target.value)}
            className="w-full rounded-md border p-2"
            rows={4}
            placeholder="Briefly describe your experience and services."
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-md bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}