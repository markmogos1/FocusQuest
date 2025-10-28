import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Profile = {
  id: string;
  created_at: string;
  name: string | null;
  birthday: string | null;
  level: number | null;
  avatar: string | null;
};

const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<"signup" | "signin">("signup");

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");

  // extra signup fields
  const [displayName, setDisplayName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [avatar, setAvatar] = useState("🧙‍♂️");

  // session / profile state
  const [supabaseUser, setSupabaseUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  // ui state
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // helper to load user + profile
  const loadSessionAndProfile = async () => {
    

    // who is logged in?
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    

    const user = userData?.user ?? null;
    setSupabaseUser(user || null);

    if (!user) {
      
      setProfile(null);
      return;
    }

    // fetch that user's profile row
    const { data: profData, error: profErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    

    if (profErr) {
      // could be: no row yet
      setProfile(null);
      return;
    }

    setProfile(profData as Profile);
  };

  // run once + subscribe to auth changes
  useEffect(() => {
    loadSessionAndProfile();

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        
        // don't await here in a blocking way; just kick off reload
        loadSessionAndProfile();
      }
    );

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  // SIGN UP
  const handleSignup = async () => {
    
    setLoading(true);
    setErr(null);
    setMsg(null);

    try {
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pw,
      });
      

      if (error) {
        setErr(error.message);
        return;
      }

      const user = data?.user;
      if (!user) {
        // this happens if email confirmation is required and no session yet
        setMsg("Account created. Check your email to confirm.");
        return;
      }

      // insert starter profile row
      
      const { error: pErr } = await supabase.from("profiles").insert({
        id: user.id, // uuid PK
        name: displayName || email,
        birthday: birthday || null,
        level: 1,
        avatar: avatar || "🧙‍♂️",
      });
      

      if (pErr) {
        // this is very often what was silently failing before
        setErr("Signed up, but failed creating profile: " + pErr.message);
        return;
      }

      setMsg("Signup complete!");
      await loadSessionAndProfile();
    } catch (e: any) {
      console.error("[handleSignup] exception", e);
      setErr("Unexpected error during signup.");
    } finally {
      
      setLoading(false);
    }
  };

  // SIGN IN
  const handleSignin = async () => {
    
    setLoading(true);
    setErr(null);
    setMsg(null);

    try
    {
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pw,
      });
      

      if (error) {
        setErr(error.message || "Login failed.");
        return;
      }

      setMsg("Signed in!");
      await loadSessionAndProfile();
    } catch (e: any) {
      console.error("[handleSignin] exception", e);
      setErr("Unexpected error during sign in.");
    } finally {
      
      setLoading(false);
    }
  };

  // SIGN OUT
  const handleSignout = async () => {
    
    await supabase.auth.signOut();
    setSupabaseUser(null);
    setProfile(null);
    setMsg("Signed out.");
  };

  return (
    <section className="min-h-dvh bg-gradient-to-br from-green-200 via-amber-100 to-amber-300 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/90 backdrop-blur rounded-2xl shadow-xl p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-extrabold text-gray-800">
              {supabaseUser
                ? "Your Account"
                : mode === "signup"
                ? "Create Account"
                : "Sign In"}
            </h1>
            <p className="text-sm text-gray-600">
              {supabaseUser
                ? "You are logged in."
                : mode === "signup"
                ? "This will also create your profile."
                : "Welcome back."}
            </p>
          </div>

          {supabaseUser && (
            <button
              onClick={handleSignout}
              className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200 font-semibold shadow"
            >
              Sign Out
            </button>
          )}
        </div>

        {/* Messages */}
        {err && (
          <div className="mb-3 rounded-lg bg-rose-100 text-rose-800 text-sm px-3 py-2 border border-rose-300">
            {err}
          </div>
        )}
        {msg && (
          <div className="mb-3 rounded-lg bg-emerald-100 text-emerald-800 text-sm px-3 py-2 border border-emerald-300">
            {msg}
          </div>
        )}

        {/* Logged-in view */}
        {supabaseUser && profile ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700 shadow-inner">
              <div className="flex items-start gap-4">
                <div className="text-4xl leading-none">
                  {profile.avatar || "🧙‍♂️"}
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <div className="text-[11px] uppercase text-gray-500 font-semibold tracking-wide">
                      Name
                    </div>
                    <div className="text-gray-900 font-medium">
                      {profile.name ?? "(no name)"}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-[11px] uppercase text-gray-500 font-semibold tracking-wide">
                        Level
                      </div>
                      <div className="text-gray-900 font-medium">
                        {profile.level ?? 1}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] uppercase text-gray-500 font-semibold tracking-wide">
                        User ID
                      </div>
                      <div className="text-gray-900 font-mono text-[13px] break-all leading-snug">
                        {profile.id}
                      </div>
                    </div>
                  </div>

                  {profile.birthday && (
                    <div>
                      <div className="text-[11px] uppercase text-gray-500 font-semibold tracking-wide">
                        Birthday
                      </div>
                      <div className="text-gray-900 font-medium">
                        {profile.birthday}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="text-[11px] uppercase text-gray-500 font-semibold tracking-wide">
                      Email
                    </div>
                    <div className="text-gray-900 font-medium break-all leading-snug">
                      {supabaseUser.email}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <a
              href="/daily"
              className="block w-full text-center rounded-xl bg-emerald-500 text-white font-semibold text-sm py-2 shadow-lg hover:bg-emerald-600"
            >
              Continue to Game →
            </a>
          </div>
        ) : (
          <>
            {/* Mode toggle */}
            <div className="flex mb-4 text-sm font-medium rounded-xl overflow-hidden border border-gray-300">
              <button
                className={`flex-1 px-3 py-2 text-center ${
                  mode === "signup"
                    ? "bg-gray-800 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => setMode("signup")}
              >
                Sign Up
              </button>
              <button
                className={`flex-1 px-3 py-2 text-center ${
                  mode === "signin"
                    ? "bg-gray-800 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => setMode("signin")}
              >
                Sign In
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* email */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Email
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-inner outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="you@example.com"
                />
              </div>

              {/* password */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-inner outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="••••••••"
                />
              </div>

              {mode === "signup" && (
                <>
                  {/* display name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Display Name
                    </label>
                    <input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-inner outline-none focus:ring-2 focus:ring-emerald-400"
                      placeholder="Mark the Focused"
                    />
                  </div>

                  {/* birthday */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Birthday
                    </label>
                    <input
                      type="date"
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-inner outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>

                  {/* avatar */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Avatar (emoji or URL)
                    </label>
                    <input
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-inner outline-none focus:ring-2 focus:ring-emerald-400"
                      placeholder="🧙‍♂️"
                    />
                  </div>
                </>
              )}

              <button
                disabled={loading}
                onClick={mode === "signup" ? handleSignup : handleSignin}
                className="w-full rounded-xl bg-emerald-500 text-white font-semibold text-sm py-2 shadow-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? "Working..."
                  : mode === "signup"
                  ? "Create Account"
                  : "Sign In"}
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default AuthPage;
