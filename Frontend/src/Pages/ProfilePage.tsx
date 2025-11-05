import React from "react";
import { useNavigate } from "react-router-dom";

const Profile: React.FC = () => {
  const navigate = useNavigate();

  const user = {
    name: "User Name",
    level: "Level 8",
    email: "12345678@gmail.com",
    birthday: "March 9, 2005",
    joinDate: "Nov 4, 2025",
  };

  return (
    <section className="absolute inset-0 flex flex-col justify-center items-center bg-gradient-to-br from-green-200 to-amber-400 text-gray-800 overflow-hidden">
      <div className="bg-white rounded-3xl shadow-xl p-10 w-full max-w-xl relative">
        {/* Return button */}
        <div className="font-semibold bg-gray-200 px-4 py-2 rounded-lg text-center mb-6bg-white text-amber-900 hover:bg-amber-800 hover:text-white transition-all px-5 py-2 h-[40px] mb-[40px] rounded-full text-l font-semibold shadow-lg cursor-pointer inline-block">
            <button
            onClick={() => navigate("/tasks")}
            >
            ← Back to List
            </button>
        </div>
        {/* Avatar */}
        <div className="flex items-center space-x-6 mb-8">
          <div className="w-24 h-24 rounded-full bg-gray-300" />
          <div>
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <p className="text-gray-600">{user.level}</p>
          </div>
        </div>

        {/* Info List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-semibold bg-gray-200 px-4 py-2 rounded-lg w-32 text-center">
              Email
            </span>
            <span>{user.email}</span>
            <button className="bg-gray-200 px-4 py-1 rounded-lg flex items-center gap-2 hover:bg-gray-300">
              Edit ✎
            </button>
          </div>

          <div className="flex justify-between items-center">
            <span className="font-semibold bg-gray-200 px-4 py-2 rounded-lg w-32 text-center">
              Password
            </span>
            <span>********</span>
            <button className="bg-gray-200 px-4 py-1 rounded-lg flex items-center gap-2 hover:bg-gray-300">
              Edit ✎
            </button>
          </div>

          <div className="flex justify-between items-center">
            <span className="font-semibold bg-gray-200 px-4 py-2 rounded-lg w-32 text-center">
              Birthday
            </span>
            <span>{user.birthday}</span>
            <button className="bg-gray-200 px-4 py-1 rounded-lg flex items-center gap-2 hover:bg-gray-300">
              Edit ✎
            </button>
          </div>

          <div className="flex justify-between items-center">
            <span className="font-semibold bg-gray-200 px-4 py-2 rounded-lg w-32 text-center">
              Join Date
            </span>
            <span>{user.joinDate}</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Profile;