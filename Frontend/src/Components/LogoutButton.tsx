import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

const LogoutButton: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout failed:", error.message);
      alert("Logout failed, please try again.");
    } else {
      navigate("/auth"); // Redirect to your login/auth page
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-amber-700 text-white px-4 py-2 rounded-full font-semibold shadow-md hover:bg-amber-800 transition-all"
    >
      Logout
    </button>
  );
};

export default LogoutButton;