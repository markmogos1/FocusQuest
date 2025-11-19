import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { addXp, addCurrency, checkAndUpdateLevel } from '../lib/xp';

// local difficulty -> xp/dmg/gold map (keeps parity with DailyQuest)
const DIFFICULTY_MAP: Record<number, { xp: number; dmg: number; gold: number }> = {
  1: { xp: 8, dmg: 10, gold: 5 },
  2: { xp: 15, dmg: 18, gold: 12 },
  3: { xp: 28, dmg: 32, gold: 25 },
  4: { xp: 45, dmg: 50, gold: 45 },
}


interface Task {
  id: string;
  user_id: string;
  name: string;
  completed?: boolean
  description: string | null;
  completed_at: string | null;
  difficulty: number | null;
  notes: string | null;
  rewards: string | null;
  created_at: string;
  xp: number; // XP reward for completing this quest
  recurrence?: any | null;
  next_due?: string | null;
}

async function questComplete(questXp: number, questGold?: number): Promise<void> {
  try{
    const {data, error} = await supabase.auth.getUser()

    if (error || !data?.user){
      throw new Error('User not logged in')
    }

    const userId = data.user.id

  const newXp = await addXp(userId, questXp)
    
    // Check and update level based on new XP
    const { level, leveledUp } = await checkAndUpdateLevel(userId, newXp)
    
    if (leveledUp) {
      console.log(`Level up! You are now level ${level}`)
    }

    console.log(`XP: ${newXp}, Level: ${level}`)
    // award currency if requested
    if (typeof questGold === 'number' && questGold !== 0) {
      try {
        const newBal = await addCurrency(userId, questGold)
        console.log(`Currency awarded: ${questGold}, balance now ${newBal}`)
      } catch (e) {
        console.error('Failed to award currency:', e)
      }
    }
     } catch (err) {
    console.error('Failed to add XP:', (err as Error).message)
    }
  }

const TaskList: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // Load user and fetch tasks on mount
  useEffect(() => {
    let isFetching = false;

    // Fetch tasks from Supabase
    const fetchTasks = async () => {
      if (isFetching) return;

      isFetching = true;
      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from("taskitem")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching tasks:", error);
          setError("Failed to load tasks");
          setTasks([]);
        } else {
          setTasks(data || []);
        }
      } catch (err) {
        console.error("Error fetching tasks:", err);
        setError("Failed to load tasks");
        setTasks([]);
      } finally {
        setLoading(false);
        isFetching = false;
      }
    };

    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: string, session: any) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          // Only fetch on INITIAL_SESSION - this is the reliable event that fires with session data
          if (event === 'INITIAL_SESSION') {
            await fetchTasks();
          }
        } else {
          // User is not signed in
          setTasks([]);
          setLoading(false);
          if (event !== 'INITIAL_SESSION') {
            setError("Please sign in to view your tasks");
          }
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Add a new task
  const addTask = async () => {
    if (!newTask.trim()) return;
    if (!user) {
      setError("Please sign in to add tasks");
      return;
    }

    setError(null);

    const { data, error } = await supabase
      .from("taskitem")
      .insert([
        {
          user_id: user.id,
          name: newTask.trim(),
          completed_at: null,
          xp: 25
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error adding task:", error);
      setError("Failed to add task");
    } else {
      setTasks([data, ...tasks]);
      setNewTask("");
    }
  };

  // Toggle task completion
  const toggleTask = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    setError(null);

    // Toggle: if completed_at is null, set to now; if set, set to null
    const newCompletedAt = task.completed_at ? null : new Date().toISOString();

    const { error } = await supabase
      .from("taskitem")
      .update({ completed_at: newCompletedAt })
      .eq("id", id);

    if (error) {
      console.error("Error updating task:", error);
      setError("Failed to update task");
    } else {
      setTasks(
        tasks.map((t) =>
          t.id === id ? { ...t, completed_at: newCompletedAt, completed: !t.completed} : t
        
        )
      );
    }
  if (!task.completed) {
    const diff = task.difficulty || 1
    const { gold } = DIFFICULTY_MAP[diff] || DIFFICULTY_MAP[1]
    await questComplete(task.xp, gold);
  }
  
  };

  // Delete a task
  const deleteTask = async (id: string) => {
    setError(null);

    const { error } = await supabase
      .from("taskitem")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting task:", error);
      setError("Failed to delete task");
    } else {
      setTasks(tasks.filter((t) => t.id !== id));
    }
  };

  return (
    <section className="min-h-dvh w-full flex flex-col justify-start items-center text-center bg-gradient-to-br from-green-200 to-amber-400 overflow-hidden pt-4 pb-12">
      <div className="flex flex-col justify-start items-center gap-y-8 max-w-4xl w-full px-4">
        {/* Branding / Logo */}
        <span className="text-[26px] font-bold text-gray-800">
          FocusQuest
        </span>

        {/* Page Title */}
        <h1 className="text-5xl text-gray-900 font-extrabold leading-tight">
          Task List
        </h1>

        {/* Error Message */}
        {error && (
          <div className="w-full max-w-2xl rounded-2xl bg-red-100 border border-red-300 text-red-800 px-6 py-4 shadow-lg">
            <p className="font-semibold">{error}</p>
            {!user && (
              <button
                onClick={() => navigate('/auth')}
                className="mt-2 text-sm underline hover:no-underline"
              >
                Go to Sign In
              </button>
            )}
          </div>
        )}

        {/* Add Task Input */}
        <div className="flex gap-4 w-full max-w-md">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            placeholder="Add a new task..."
            className="flex-1 px-4 py-3 rounded-full text-lg border-0 outline-none shadow-lg text-gray-800 placeholder-gray-500"
          />
          <button
            onClick={addTask}
            className="bg-white text-amber-900 hover:bg-amber-800 hover:text-white transition-all px-6 py-3 rounded-full text-lg font-semibold shadow-lg cursor-pointer"
          >
            Add
          </button>
        </div>

        {/* Task List */}
        <div className="w-full max-w-2xl space-y-4">
          {loading ? (
            <p className="text-lg text-gray-700 py-8">
              Loading tasks...
            </p>
          ) : tasks.length === 0 ? (
            <p className="text-lg text-gray-700 py-8">
              No tasks yet. Add one above to get started!
            </p>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className={`bg-white rounded-2xl p-6 shadow-lg transition-all hover:shadow-xl ${
                  task.completed_at ? 'opacity-75' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={!!task.completed_at}
                    onChange={() => toggleTask(task.id)}
                    className="w-6 h-6 text-amber-600 rounded border-2 border-gray-300 focus:ring-amber-500"
                  />
                      <div className="flex-1 text-left">
                        <span
                          className={`block text-lg ${task.completed_at ? 'line-through text-gray-500' : 'text-gray-800'}`}
                        >
                          {task.name}
                        </span>
                        {/* Recurrence / repeats info */}
                        {(() => {
                          try {
                            const rec = typeof task.recurrence === 'string' && task.recurrence ? JSON.parse(task.recurrence) : task.recurrence;
                            if (!rec) return null;
                            if (rec.type === 'one-time') {
                              const dateStr = task.next_due ? new Date(task.next_due).toLocaleDateString() : null;
                              return <div className="text-sm text-gray-500 mt-1">One-time{dateStr ? ` — due ${dateStr}` : ''}</div>;
                            }
                            if (rec.type === 'daily') {
                              return <div className="text-sm text-gray-500 mt-1">Repeats daily{rec.count ? ` — ${rec.count}×` : ' — indefinitely'}</div>;
                            }
                            if (rec.type === 'every_n_days') {
                              return <div className="text-sm text-gray-500 mt-1">Repeats every {rec.interval || 1} day(s){rec.count ? ` — ${rec.count}×` : ' — indefinitely'}</div>;
                            }
                            if (rec.type === 'weekly') {
                              // rec.byweekday uses 0 (Sun) - 6 (Sat) per our recurrence.ts
                              const weekdayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
                              let daysStr = ''
                              try {
                                if (Array.isArray(rec.byweekday)) {
                                  daysStr = (rec.byweekday as any[])
                                    .map((d) => {
                                      if (typeof d === 'number') return weekdayNames[d] || String(d)
                                      // handle strings like 'MO' or 'Tue'
                                      if (typeof d === 'string') {
                                        // try to map common two-letter forms
                                        const upper = d.toUpperCase()
                                        const map: Record<string, string> = { MO: 'Mon', TU: 'Tue', TUe: 'Tue', WE: 'Wed', TH: 'Thu', FR: 'Fri', SA: 'Sat', SU: 'Sun' }
                                        if (map[upper.slice(0,2)]) return map[upper.slice(0,2)]
                                        return d
                                      }
                                      return String(d)
                                    })
                                    .join('/')
                                }
                              } catch (e) {
                                daysStr = ''
                              }
                              return <div className="text-sm text-gray-500 mt-1">Repeats weekly{daysStr ? ` — ${daysStr}` : ''}{rec.count ? ` — ${rec.count}×` : ''}</div>;
                            }
                            // fallback
                            return <div className="text-sm text-gray-500 mt-1">Repeats{rec.count ? ` — ${rec.count}×` : ' — indefinitely'}</div>;
                          } catch (e) {
                            return null;
                          }
                        })()}
                      </div>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="text-red-500 hover:text-red-700 transition-colors px-2 py-1 rounded"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-8 text-lg text-gray-700">
          <span>Total: {tasks.length}</span>
          <span>Completed: {tasks.filter(t => t.completed_at).length}</span>
          <span>Remaining: {tasks.filter(t => !t.completed_at).length}</span>
        </div>

        {/* Navigation */}
        <button 
          onClick={() => navigate('/')}
          className="bg-white text-amber-900 hover:bg-amber-800 hover:text-white transition-all px-8 py-4 rounded-full text-xl font-semibold shadow-lg cursor-pointer"
        >
          ← Back to Home
        </button>
      </div>
    </section>
  );
};

export default TaskList;
