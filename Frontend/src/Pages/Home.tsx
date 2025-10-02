import React from "react";
import { useNavigate } from "react-router-dom";


const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
<section className="absolute inset-0 flex flex-col justify-center items-center text-center bg-gradient-to-br from-green-200 to-amber-400 overflow-hidden">
    <div className="flex flex-col justify-center items-center gap-y-8 max-w-2xl">
        {/* Branding / Logo */}
        <span className="text-[26px] font-bold text-gray-800">
          FocusQuest
        </span>

        {/* Headline */}
        <h1 className="text-6xl text-gray-900 font-extrabold leading-tight">
          Todo <br /> Game!
        </h1>

        {/* Description */}
        <p className="text-lg text-gray-700 max-w-md">
          Some Description Here
        </p>

          <button 
            onClick={() => navigate('/tasks')}
            className="bg-white text-amber-900 hover:bg-amber-800 hover:text-white transition-all px-8 py-4 rounded-full text-xl font-semibold shadow-lg cursor-pointer"
          >
            Explore the world of Gamified Todos! →
          </button>

      </div>
    </section>
  );
};

export default Home;