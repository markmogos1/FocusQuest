import React, { useMemo, useState } from "react";
import { addXp } from '../lib/xp';
import { supabase } from '../lib/supabaseClient';

// --- Types ---
interface Quest {
  id: number;
  title: string;
  reward?: string;
  completed?: boolean;
  dmg?: number; // damage dealt when completed
  xp: number; // XP reward for completing this quest
}

async function questComplete(questXp: number): Promise<void> {
  try{
    const {data, error} = await supabase.auth.getUser()

    if (error || !data?.user){
      throw new Error('User not logged in')
    }

    const userId = data.user.id

    const newXp = await addXp(userId, questXp)

    console.log(newXp)
     } catch (err) {
    console.error('Failed to add XP:', (err as Error).message)
    }
  }

// --- UI Primitives ---
const Card: React.FC<React.PropsWithChildren<{ title?: string; className?: string }>> = ({ title, className, children }) => (
  <div className={`bg-white/90 backdrop-blur rounded-2xl shadow-xl p-5 md:p-6 ${className || ""}`}>
    {title && <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">{title}</h2>}
    {children}
  </div>
);

const StatChip: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="rounded-xl bg-white border border-gray-200 px-3 py-2 text-center">
    <div className="text-xs text-gray-500">{label}</div>
    <div className="text-sm font-bold text-gray-800">{value}</div>
  </div>
);

// --- Battle ---
const MonsterBattle: React.FC<{ maxHP: number; hp: number; hits: number; totalNodes: number; reward: string; xp:number}>
= ({ maxHP, hp, hits, totalNodes, reward }) => {
  const pct = Math.max(0, Math.min(100, (hp / maxHP) * 100));
  const nodes = Array.from({ length: totalNodes }, (_, i) => i);

  return (
    <div className="relative bg-gradient-to-r from-green-100 to-green-200 p-4 rounded-xl border border-green-300">
      {/* Enemy HP Bar */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold text-gray-700">Enemy HP</div>
        <div className="text-xs text-gray-600 font-mono">{hp}/{maxHP}</div>
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-3">
        <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>      

      {/* Battle field */}
      <div className="flex justify-between items-center bg-cyan-200 mt-5 rounded-xl p-3">
        <span className="text-4xl">🧍‍♂️</span>
        <span className="text-5xl">👹</span>
      </div>
      <div className="flex items-center justify-between mt-3 text-sm text-gray-700">
        <span>Complete dailies to deal damage!</span>
        <span className="flex items-center gap-1"><span>🎁</span><b>{reward}</b></span>
      </div>
    </div>
  );
};

// --- Quest Toggle ---
const QuestToggle: React.FC<{ q: Quest; onToggle?: (id: number) => void }>
= ({ q, onToggle }) => (
  <label
    className={`group flex items-center gap-3 p-3 rounded-xl border transition hover:shadow ${q.completed ? "bg-emerald-50 border-emerald-200" : "bg-white border-gray-200"}`}
  >
    <input
      type="checkbox"
      className="w-5 h-5 rounded border-gray-300"
      checked={!!q.completed}
      onChange={() => onToggle?.(q.id)}
    />
    <span className={`flex-1 text-lg ${q.completed ? "line-through text-gray-500" : "text-gray-800"}`}>{q.title}</span>
    {typeof q.dmg === "number" && (
      <span className="text-xs md:text-sm px-2 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200">{q.dmg} dmg</span>
    )}
    {q.reward && (
      <span className="text-xs md:text-sm px-2 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">{q.reward}</span>
    )}
  </label>
);

// --- Page ---
const DailyQuestPage: React.FC = () => {
  // Static demo data (we'll wire to real data later)
  const [dailyQuests, setDailyQuests] = useState<Quest[]>([
    { id: 1, title: "Drink 2L of water", reward: "+10 XP", dmg: 12, completed: false, xp: 10 },
    { id: 2, title: "10-minute stretch", reward: "+5 XP", dmg: 8, completed: true, xp: 5 },
    { id: 3, title: "Inbox to zero", reward: "+8 XP", dmg: 10, completed: false, xp: 8},
  ]);

  const [todayGoals, setTodayGoals] = useState<Quest[]>([
    { id: 101, title: "Finish homework set 5", reward: "+25 XP", completed: false, xp: 25},
    { id: 102, title: "Ship ClassLinker PR #42", reward: "+20 XP", completed: false, xp: 20},
  ]);

  // Player & Enemy stats (static for now)
  const PLAYER_ATTACK = 10; // base attack (flavor stat)
  const ENEMY_MAX_HP = 100;

  // Derived battle values
  const totalDamage = useMemo(() => dailyQuests.reduce((acc, q) => acc + (q.completed && q.dmg ? q.dmg : 0), 0), [dailyQuests]);
  const enemyHP = Math.max(0, ENEMY_MAX_HP - totalDamage);
  const hits = dailyQuests.filter(q => q.completed).length;

  // Handlers
  const toggleDaily = async (id: number) => {
    // Find the quest you're toggling so you can access its XP
    const quest = dailyQuests.find(q => q.id === id);
    if (!quest) return; // just in case

    // Update state (flip completion)
    setDailyQuests(qs =>
      qs.map(q => q.id === id ? { ...q, completed: !q.completed } : q)
    );

    // Call XP function only if it was *just completed*
    if (!quest.completed) {
      await questComplete(quest.xp);
    }
  };
  const toggleGoal = async (id: number) => {
    // Find the goal first so we can read its XP before updating
    const goal = todayGoals.find(q => q.id === id);
    if (!goal) return; // safety guard

    // Update completion state
    setTodayGoals(qs =>
      qs.map(q =>
        q.id === id ? { ...q, completed: !q.completed } : q
      )
    );

    // If goal was previously incomplete, award XP
    if (!goal.completed) {
      await questComplete(goal.xp);
    }
  };


  
  return (
    <section className="min-h-dvh w-full bg-gradient-to-br from-green-200 via-amber-100 to-amber-300">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-extrabold text-gray-900">FocusQuest</div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Daily</span>
          </div>
          <div className="text-sm text-gray-700">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {/* Top Left: Character */}
          <Card title="Adventurer">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="size-20 md:size-24 rounded-2xl bg-amber-200/80 border border-amber-300 shadow-inner grid place-content-center text-3xl">🛡️</div>
                <span className="absolute -bottom-2 -right-2 px-2 py-0.5 text-xs rounded-full bg-emerald-600 text-white shadow">Lv 7</span>
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-800 text-lg">Mark the Focused</div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <StatChip label="Attack" value={`${PLAYER_ATTACK}`} />
                  <StatChip label="Current HP" value={"100/100"} />
                  <StatChip label="Hits" value={hits} />
                </div>
                <div className="mt-3">
                  <div className="text-xs text-gray-600 mb-1">XP</div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full w-[65%] bg-emerald-500" />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Top Right: Battle Arena */}
          <Card title="Battle Arena">
            <MonsterBattle maxHP={ENEMY_MAX_HP} hp={enemyHP} hits={hits} totalNodes={5} reward={"Daily Chest: 50 XP + 1 Key"} xp={50}/>
          </Card>

          {/* Bottom Left: Daily Quests */}
          <Card title="Daily Quests">
            <div className="space-y-3">
              {dailyQuests.map((q) => (
                <QuestToggle key={q.id} q={q} onToggle={toggleDaily} />
              ))}
            </div>
            <div className="mt-4 text-sm text-gray-600">
              Damage so far: <b>{totalDamage}</b>
            </div>
          </Card>

          {/* Bottom Right: Goals Today (interactive) */}
          <Card title="Goals Today">
            <div className="space-y-3">
              {todayGoals.map((q) => (
                <QuestToggle key={q.id} q={q} onToggle={toggleGoal} />
              ))}
            </div>
            <div className="mt-3 text-xs text-gray-600">Tip: These goals don't affect battle (yet) — just for focus.</div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default DailyQuestPage;