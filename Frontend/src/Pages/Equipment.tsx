import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

type Equipment = {
  armorName: string;
  armorValue: number;
  weaponName: string;
  weaponAttack: number;
};

const Equipment: React.FC = () => {
  const navigate = useNavigate();

  const [equipment] = useState<Equipment>({
    armorName: "Dragon Armor 🦹",
    armorValue: 85,
    weaponName: "Excalibur 🗡️",
    weaponAttack: 120,
  });

  return (
    <section className="min-h-screen bg-gradient-to-br from-green-200 to-amber-400 flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-lg">
        <h1 className="text-2xl font-bold mb-6 text-center">Your Gear</h1>

        <div className="flex flex-col space-y-6">
          {/* Armor */}
          <div className="flex justify-between items-center bg-gray-100 p-4 rounded-2xl shadow">
            <div>
              <h2 className="font-semibold text-xl">{equipment.armorName}</h2>
              <p className="text-gray-600 text-sm">Armor Value: {equipment.armorValue}</p>
            </div>
          </div>

          {/* Weapon */}
          <div className="flex justify-between items-center bg-gray-100 p-4 rounded-2xl shadow">
            <div>
              <h2 className="font-semibold text-xl">{equipment.weaponName}</h2>
              <p className="text-gray-600 text-sm">Attack: {equipment.weaponAttack}</p>
            </div>
          </div>

          {/* Back button */}
          <div
            onClick={() => navigate("/profile")}
            className="w-full bg-amber-500 text-white font-semibold py-3 rounded-2xl shadow hover:bg-amber-600 transition text-center cursor-pointer"
          >
            ← Back to Profile
          </div>
        </div>
      </div>
    </section>
  );
};

export default Equipment;