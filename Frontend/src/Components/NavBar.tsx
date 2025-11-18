import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<any | null>(null);

  useEffect(() => {
  const loadUser = async () => {
    const { data } = await supabase.auth.getUser();
    setCurrentUser(data?.user ?? null);
  };

  loadUser();

  const { data: listener } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setCurrentUser(session?.user ?? null);
    }
  );

  return () => listener.subscription.unsubscribe();
  }, []);

  const loggedIn = [
    { name: "Home", path: "/" },
    { name: "Tasks", path: "/tasks" },
    { name: "About", path: "/about" },
    { name: "Daily Quest", path: "/daily"},
    { name: "Shop", path: "/shop"},
    { name: "Calendar", path: "/calendar"}
  ];
  const loggedOut = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Sign In / Sign Up", path: "/auth"}
  ]
  if (currentUser) {
    return (
      <nav className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-sm shadow-sm z-50">
  <div className="w-full px-6 py-3 flex items-center">
          {/* Logo */}
          <span
            onClick={() => navigate("/")}
            className="text-2xl font-bold text-amber-800 cursor-pointer mr-4"
          >
            FocusQuest
          </span>

          {/* spacer to push content to the right */}
          <div className="flex-1" />

          {/* Right-aligned links + controls */}
          <div className="flex items-center gap-4">
            {/* Links (hidden on small screens) */}
            <div className="hidden md:flex gap-x-8 items-center">
              {loggedIn.map((link) => (
                <button
                  key={link.name}
                  onClick={() => navigate(link.path)}
                  className={`text-lg font-medium transition-all ${
                    location.pathname === link.path
                      ? "text-amber-800 underline underline-offset-4"
                      : "text-gray-700 hover:text-amber-800"
                  }`}
                >
                  {link.name}
                </button>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-amber-900 font-bold text-xl"
              onClick={() => alert("Open menu (to implement later!)")}
            >
              ☰
            </button>

            {/* Profile Avatar */}
            <button
              onClick={() => navigate("/profile")}
              className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
            >
              <img
                src="https://assets.puzzlefactory.com/puzzle/254/191/original.webp"
                alt="avatar"
                className="w-10 h-10 rounded-full"
              />
            </button>
          </div>
        </div>
      </nav>
    );
  } else {
    return (
      <nav className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-sm shadow-sm z-50">
  <div className="w-full px-6 py-3 flex items-center">
          {/* Logo */}
          <span
            onClick={() => navigate("/")}
            className="text-2xl font-bold text-amber-800 cursor-pointer mr-4"
          >
            FocusQuest
          </span>

          {/* spacer to push content to the right */}
          <div className="flex-1" />

          {/* Right-aligned links + controls (logged-out) */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex gap-x-8 items-center">
              {loggedOut.map((link) => (
                <button
                  key={link.name}
                  onClick={() => navigate(link.path)}
                  className={`text-lg font-medium transition-all ${
                    location.pathname === link.path
                      ? "text-amber-800 underline underline-offset-4"
                      : "text-gray-700 hover:text-amber-800"
                  }`}
                >
                  {link.name}
                </button>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-amber-900 font-bold text-xl"
              onClick={() => alert("Open menu (to implement later!)")}
            >
              ☰
            </button>
          </div>
        </div>
      </nav>
    );
  }
};

export default Navbar;
