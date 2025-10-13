import React from "react";
import { useNavigate } from "react-router-dom";

const About: React.FC = () => {
    const navigate = useNavigate();
    return (
        <section className="min-h-screen w-full bg-gradient-to-br from-green-200 to-amber-400 py-16 px-4">
            <div className="container mx-auto max-w-5xl bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
                
                {/* Top Section */}
                <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
                    
                    {/* Left Column */}
                    <div className="md:w-1/2 text-center md:text-left">
                        <span className="text-2xl font-bold text-gray-800">
                            FocusQuest
                        </span>
                        <h1 className="text-4xl text-gray-900 font-extrabold leading-tight mt-2">
                            About Us!
                        </h1>
                        <p className="text-lg text-gray-700 max-w-md mt-4">
                            Whether you're tackling a major project, building new habits, or just managing daily chores, 
                            FocusQuest provides the structure and the fun to keep you going. 
                            Join our community and start your journey to becoming more productive today!
                        </p>
                    </div>

                    {/* Right Column */}
                    <div className="md:w-1/2">
                        {/* Image Place Holder */}
                        <img 
                            src="src/assets/QuestPage.png" 
                            alt="A screenshot of the Quest Page"
                            className="rounded-xl shadow-2xl w-full h-auto"
                        />
                    </div>
                </div>

                {/* Divider */}
                <div className="my-12 border-t border-gray-300"></div>

                {/* Game Elements */}
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900">Core Game Elements</h2>
                    <p className="text-lg text-gray-700 max-w-2xl mx-auto mt-4">
                        We turn your to-do list into an adventure. Here are some of the mechanics you'll encounter on your quest for productivity:
                    </p>
                    
                    {/* Placeholder List */}
                    <ul className="mt-6 text-left max-w-md mx-auto space-y-3 text-gray-600">
                        <li className="flex items-start gap-3">
                            <span className="font-bold text-amber-800">-</span>
                            <strong>Experience Points (XP):</strong> Earn XP for every task you complete and watch your level rise.
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="font-bold text-amber-800">-</span>
                            <strong>Achievements:</strong> Unlock special badges for reaching milestones and completing difficult challenges.
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="font-bold text-amber-800">-</span>
                            <strong>Customization:</strong> Use your progress to unlock new themes, avatars, or other fun cosmetic rewards.
                        </li>
                    </ul>
                </div>

                <div className="text-center mt-12">
                    <button 
                        onClick={() => navigate('/')}
                        className="bg-white text-amber-900 hover:bg-amber-800 hover:text-white transition-all px-8 py-4 rounded-full text-xl font-semibold shadow-lg cursor-pointer"
                    >
                        ← Back to Home
                    </button>
                </div>

            </div>
        </section>
    );
};

export default About;
