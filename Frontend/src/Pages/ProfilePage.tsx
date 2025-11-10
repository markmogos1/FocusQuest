import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LogoutButton from "../Components/LogoutButton";
import { supabase } from "../lib/supabaseClient";

type ProfileRow = {
  id: string;           
  name?: string | null;
  level?: string | null;
  birthday?: string | null;
};

const Profile: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [authEmail, setAuthEmail] = useState<string>("");
  const [joinDateISO, setJoinDateISO] = useState<string>("");
  const [profile, setProfile] = useState<ProfileRow | null>(null);

  // Load user and profile
  useEffect(() => {
    (async () => {
      setLoading(true);

      const {
        data: { user },
        error: authErr,
      } = await supabase.auth.getUser();

      if (authErr || !user) {
        // Not logged in – go to auth page
        navigate("/auth");
        return;
      }

      setAuthEmail(user.email ?? "");
      setJoinDateISO(user.created_at ?? "");

      // Fetch profile row
      const { data: prof, error: profErr } = await supabase
        .from("profiles")
        .select("id, name, level, birthday")
        .eq("id", user.id)
        .single();

      if (profErr) {
        console.error("Failed to load profile:", profErr);
      } else {
        setProfile(prof as ProfileRow);
      }

      setLoading(false);
    })();
  }, [navigate]);

  // Helpers
  function formatDateForUI(iso?: string) {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString();
    } catch {
      return iso;
    }
  }
  async function refreshProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("id, name, level, birthday")
      .eq("id", user.id)
      .single();
    if (data) setProfile(data as ProfileRow);
  }
  async function handleEditEmail() {
    const newEmail = window.prompt("Enter a new email:", authEmail);
    if (!newEmail || newEmail === authEmail) return;

    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) {
      alert(`Email update failed: ${error.message}`);
      return;
    }
    setAuthEmail(newEmail);
  }

  async function handleEditPassword() {
    const newPassword = window.prompt("Enter a new password:");
    if (!newPassword) return;

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      alert(`Password update failed: ${error.message}`);
      return;
    }
    alert("Password updated!");
  }

  async function handleEditBirthday() {
    if (!profile) return;
    const current = profile.birthday ?? "";
    const newBirthday = window.prompt(
      "Enter your birthday (YYYY-MM-DD):",
      current
    );
    if (!newBirthday || newBirthday === current) return;

    const { error } = await supabase
      .from("profiles")
      .update({ birthday: newBirthday })
      .eq("id", profile.id);

    if (error) {
      alert(`Birthday update failed: ${error.message}`);
      return;
    }
    await refreshProfile();
    alert("Birthday updated!");
  }

  return (
    <section className="absolute inset-0 flex flex-col justify-center items-center bg-gradient-to-br from-green-200 to-amber-400 text-gray-800 overflow-hidden">
      <div className="bg-white rounded-3xl shadow-xl p-10 w-full max-w-xl relative">
        {/* Return button */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/tasks")}
            className="font-semibold bg-gray-200 px-5 py-2 h-[40px] rounded-full text-l shadow-lg hover:bg-amber-800 hover:text-white transition-all"
          >
            ← Back to List
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-gray-600">Loading profile…</div>
        ) : !profile ? (
          <div className="py-8 text-center text-red-600">
            Profile not found. Try logging out and in again.
          </div>
        ) : (
          <>
            {/* Avatar */}
            <div className="flex items-center space-x-6 mb-8">
              <div className="w-24 h-24 rounded-full bg-gray-300" />
              <div>
                <h2 className="text-2xl font-bold">{profile.name ?? "User Name"}</h2>
                <p className="text-gray-600">{profile.level ?? "Level 1"}</p>
              </div>
            </div>

            {/* Info List */}
            <div className="space-y-4">
              {/* Email */}
              <div className="flex justify-between items-center">
                <span className="font-semibold bg-gray-200 px-4 py-2 rounded-lg w-32 text-center">
                  Email
                </span>
                <span className="truncate max-w-[50%]">{authEmail || "—"}</span>
                <button
                  className="bg-gray-200 px-4 py-1 rounded-lg flex items-center gap-2 hover:bg-gray-300"
                  onClick={handleEditEmail}
                >
                  Edit ✎
                </button>
              </div>

              {/* Password */}
              <div className="flex justify-between items-center">
                <span className="font-semibold bg-gray-200 px-4 py-2 rounded-lg w-32 text-center">
                  Password
                </span>
                <span>********</span>
                <button
                  className="bg-gray-200 px-4 py-1 rounded-lg flex items-center gap-2 hover:bg-gray-300"
                  onClick={handleEditPassword}
                >
                  Edit ✎
                </button>
              </div>

              {/* Birthday */}
              <div className="flex justify-between items-center">
                <span className="font-semibold bg-gray-200 px-4 py-2 rounded-lg w-32 text-center">
                  Birthday
                </span>
                <span>
                  {profile.birthday
                    ? profile.birthday
                    : "Not set"}
                </span>
                <button
                  className="bg-gray-200 px-4 py-1 rounded-lg flex items-center gap-2 hover:bg-gray-300"
                  onClick={handleEditBirthday}
                >
                  Edit ✎
                </button>
              </div>

              {/* Join Date */}
              <div className="flex justify-between items-center">
                <span className="font-semibold bg-gray-200 px-4 py-2 rounded-lg w-32 text-center">
                  Join Date
                </span>
                <span>{formatDateForUI(joinDateISO)}</span>
              </div>
              <div className="flex justify-between mb-6">
                <button
                  onClick={() => navigate("/tasks")}
                  className="font-semibold bg-gray-200 px-5 py-2 h-[40px] rounded-full text-l shadow-lg hover:bg-amber-800 hover:text-white transition-all"
                >
                  ← Back to List
                </button>

                
                <LogoutButton />
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default Profile;