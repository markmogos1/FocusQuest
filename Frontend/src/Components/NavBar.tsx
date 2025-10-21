import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const links = [
    { name: "Home", path: "/" },
    { name: "Tasks", path: "/tasks" },
    { name: "About", path: "/about" },
    { name: "Daily Quest", path: "/daily"}
  ];

  return (
    <nav className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-sm shadow-sm z-50">
      <div className="max-w-6xl mx-auto px-6 py-3 flex justify-between items-center">
        {/* Logo */}
        <span
          onClick={() => navigate("/")}
          className="text-2xl font-bold text-amber-800 cursor-pointer"
        >
          FocusQuest
        </span>

        {/* Links */}
        <div className="hidden md:flex gap-x-8">
          {links.map((link) => (
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
    </nav>
  );
};

export default Navbar;
