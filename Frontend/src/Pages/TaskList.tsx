import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

interface Task {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  completed_at: string | null;
  difficulty: number | null;
  notes: string | null;
  rewards: string | null;
  created_at: string;
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
          t.id === id ? { ...t, completed_at: newCompletedAt } : t
        )
      );
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
    <section className="absolute inset-0 flex flex-col justify-center items-center text-center bg-gradient-to-br from-green-200 to-amber-400 overflow-hidden">
      <div className="flex flex-col justify-center items-center gap-y-8 max-w-4xl w-full px-4">
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
                  <span
                    className={`flex-1 text-left text-lg ${
                      task.completed_at
                        ? 'line-through text-gray-500'
                        : 'text-gray-800'
                    }`}
                  >
                    {task.name}
                  </span>
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
        {/* Profile Avatar */}
        <button
          onClick={() => navigate("/profile")}
          className=" absolute top-12 right-6 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
        >
          <img
            src="https://assets.puzzlefactory.com/puzzle/254/191/original.webp"
            alt="avatar"
            className="w-10 h-10 rounded-full"
          />
        </button>
      </div>
    </section>
  );
};

export default TaskList;
